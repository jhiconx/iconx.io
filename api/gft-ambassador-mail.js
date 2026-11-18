// Server-only Resend relay for the independent GFT Rewards Store Ambassador site.
// Fixed recipients; never accepts arbitrary destination addresses or HTML from callers.
const RECIPIENTS=['rcramer@iconx.io','support@gftrewards.com'];
const validOrigin=origin=>!origin||/^https:\/\/gft-rewards-store-ambassadors(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
const clean=(value,max)=>String(value??'').trim().slice(0,max+1);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const origin=String(req.headers.origin||'');
  if(origin&&!validOrigin(origin))return res.status(403).json({ok:false,error:'Origin not allowed'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method==='GET'&&req.query?.health==='1')
    return res.status(200).json({ok:true,ready:Boolean(process.env.RESEND_API_KEY),senderConfigured:Boolean(process.env.CONTACT_FROM_EMAIL||process.env.SAMPLE_FROM_EMAIL),transport:'Resend'});
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
  if(Number(req.headers['content-length']||0)>6500)return res.status(413).json({ok:false,error:'Request too large'});
  let body=req.body;
  if(typeof body==='string'){try{body=JSON.parse(body)}catch{return res.status(400).json({ok:false,error:'Invalid request'})}}
  if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({ok:false,error:'Invalid request'});
  if(clean(body.website,200))return res.status(200).json({ok:true,emailed:true});
  const d={
    id:clean(body.id,36),full_name:clean(body.full_name,150),
    email:clean(body.email,254).toLowerCase(),
    mobile:clean(body.mobile,40),state:clean(body.state,2),
    territory:clean(body.territory,12),base_city:clean(body.base_city,120),
    retail_experience:clean(body.retail_experience,1600)
  };
  const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.id)&&
    d.full_name.length>=2&&d.full_name.length<=150&&
    /^\S+@\S+\.\S+$/.test(d.email)&&d.email.length<=254&&
    d.mobile.replace(/\D/g,'').length>=7&&d.mobile.length<=40&&
    ['FL','NY'].includes(d.state)&&new RegExp('^'+d.state+'-\\d{2}$').test(d.territory)&&
    d.base_city.length>=2&&d.base_city.length<=120&&d.retail_experience.length<=1600;
  if(!valid)return res.status(400).json({ok:false,error:'Invalid application'});
  if(!process.env.RESEND_API_KEY)return res.status(503).json({ok:false,error:'Email service is not configured'});
  const fields=[
    ['Applicant',d.full_name],['Email',d.email],['Mobile',d.mobile],
    ['State',d.state],['Territory',d.territory],['City or ZIP',d.base_city],
    ['English and Spanish','Confirmed'],['GFT platform training','Acknowledged'],
    ['Retail experience',d.retail_experience||'Not provided']
  ];
  const html='<h2>GFT Rewards Store Ambassador Application</h2><p>Field recruiting by Iconx.io · A Registered GFT Rewards Agency.</p><table cellpadding="8">'+
    fields.map(([k,v])=>'<tr><th align="left">'+esc(k)+'</th><td>'+esc(v)+'</td></tr>').join('')+'</table>';
  try{
    const mail=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,
        'Content-Type':'application/json','Idempotency-Key':'gft-store-ambassador/'+d.id},
      body:JSON.stringify({
        from:process.env.CONTACT_FROM_EMAIL||process.env.SAMPLE_FROM_EMAIL||'Iconx.io Website <website@iconx.io>',
        to:RECIPIENTS,reply_to:d.email,
        subject:'GFT Rewards Store Ambassador Application — '+d.territory+' — '+d.full_name,
        html
      }),
      signal:AbortSignal.timeout(9500)
    });
    const response=await mail.json().catch(()=>({}));
    if(!mail.ok||!response.id){console.error('GFT Resend failed',mail.status);return res.status(502).json({ok:false,error:'Email delivery not accepted'});}
    return res.status(200).json({ok:true,emailed:true});
  }catch(error){console.error('GFT Resend unavailable',error instanceof Error?error.name:'unknown');return res.status(503).json({ok:false,error:'Email service unavailable'});}
};