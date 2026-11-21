// Server-only Resend relay for the independent GFT Rewards Store Ambassador site.
// Fixed recipients; never accepts arbitrary destination addresses or HTML from callers.
const RECIPIENTS=['rcramer@iconx.io','support@gftrewards.com'];

const WELCOME_FROM='GFT Retail Solutions <GFTAmbassadors@iconx.io>';
function welcomeEmail(fullName,language){
  const first=esc(String(fullName||'there').trim().split(/\s+/)[0]||'there');
  const es=language==='es';
  const c=es?{
    subject:'🎉 ¡Recibimos tu solicitud! Ya estás en consideración.',
    hi:'¡Hola ',headline:'¡LO LOGRASTE.<br>RECIBIMOS TU SOLICITUD! 🚀',
    intro:'Tu solicitud para ser <strong>GFT Retail Ambassador</strong> llegó correctamente.',
    purpose:'Estamos creando algo emocionante con <strong>GFT Retail Solutions</strong>, conectando estudiantes, tiendas, marcas y comunidades mediante la ejecución comercial y las recompensas.',
    firstStep:'Y acabas de dar el primer paso para formar parte de ello.',
    next:'🔥 ¿QUÉ SIGUE?',
    step1:'✅ <strong>Solicitud recibida</strong> — ¡Ya estás en nuestro sistema!',
    step2:'👀 <strong>Estamos revisando tu perfil</strong> — Nuestro equipo evaluará tu solicitud.',
    step3:'📲 <strong>Mantente pendiente</strong> — Si avanzas, nos comunicaremos contigo para explicarte los siguientes pasos.',
    tagline:'Ejecución en tiendas. Oportunidades reales. Tu territorio.',
    thanks:'Gracias por dar este paso. ¡Nos encanta tu entusiasmo!',
    bye:'¡Nos vemos en las tiendas! ✌️',
    sign:'El equipo de embajadores de Iconx',program:'GFT Retail Solutions',motto:'Conecta. Gana. Genera impacto.'
  }:{
    subject:"🎉 We Got Your Application. You're In the Mix!",
    hi:'Hey ',headline:'YOU DID IT.<br>YOUR APPLICATION IS IN! 🚀',
    intro:'Your application to become a <strong>GFT Retail Ambassador</strong> has officially landed!',
    purpose:"We're building something exciting with <strong>GFT Retail Solutions</strong>, connecting students, local retailers, brands, and communities through retail execution and shopper rewards.",
    firstStep:'And you just took the first step toward being part of it.',
    next:'🔥 SO, WHAT HAPPENS NEXT?',
    step1:"✅ <strong>Application Received</strong> — You're officially in our system!",
    step2:"👀 <strong>We're Checking You Out</strong> — Our team will review your application.",
    step3:"📲 <strong>Stay Tuned</strong> — If you're selected to move forward, we'll reach out with next steps.",
    tagline:'Retail Execution. Real opportunities. Your territory.',
    thanks:'Thanks for stepping up. We love the energy!',
    bye:'See you in-store! ✌️',
    sign:'The Iconx Ambassador Team',program:'GFT Retail Solutions',motto:'Connect. Earn. Make an Impact.'
  };
  const bodyLines=[
    '<p style="margin:0 0 24px;font:400 18px/1.55 Arial,Helvetica,sans-serif;">'+c.hi+first+'! 👋</p>',
    '<h1 style="font:bold 29px/1.24 Arial,Helvetica,sans-serif;letter-spacing:-.5px;color:#52278a;margin:0 0 26px;">'+c.headline+'</h1>',
    '<p style="margin:0 0 13px;">'+c.intro+'</p>',
    '<p style="margin:0 0 13px;">'+c.purpose+'</p>',
    '<p style="margin:0 0 28px;">'+c.firstStep+'</p>',
    '<h2 style="font:bold 22px/1.3 Arial,Helvetica,sans-serif;color:#7442bb;margin:0 0 18px;">'+c.next+'</h2>',
    '<p style="margin:0 0 17px;">'+c.step1+'</p>',
    '<p style="margin:0 0 17px;">'+c.step2+'</p>',
    '<p style="margin:0 0 35px;">'+c.step3+'</p>',
    '<h2 style="font:bold 22px/1.3 Arial,Helvetica,sans-serif;color:#52278a;margin:0 0 20px;">'+c.tagline+'</h2>',
    '<p style="margin:0 0 18px;">'+c.thanks+'</p>',
    '<p style="margin:0 0 34px;">'+c.bye+'</p>',
    '<p style="margin:0;"><strong>'+c.sign+'</strong><br><em>'+c.program+'</em><br><strong>'+c.motto+'</strong></p>'
  ].join('');
  const html='<!doctype html><html lang="'+(es?'es':'en')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
    '<body style="margin:0;background:#f8f5ff;padding:32px 13px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#27212c;">'+
    '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td align="center">'+
    '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:650px;width:100%;border-radius:25px;background:#fff;border-collapse:separate;overflow:hidden;"><tr><td style="padding:50px 34px 42px;text-align:left;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#27212c;">'+bodyLines+'</td></tr></table>'+
    '</td></tr></table></body></html>';
  const text=String(fullName||'').trim().split(/\s+/)[0];
  const plain=[
    c.hi+text+'! 👋',
    c.headline.replace('<br>',' '),
    c.intro.replace(/<[^>]*>/g,''),
    c.purpose.replace(/<[^>]*>/g,''),
    c.firstStep,c.next,
    c.step1.replace(/<[^>]*>/g,''),c.step2.replace(/<[^>]*>/g,''),c.step3.replace(/<[^>]*>/g,''),
    c.tagline,c.thanks,c.bye,c.sign,c.program,c.motto
  ].join('\n\n');
  return {subject:c.subject,html,text:plain};
}

async function sendWelcome(d){
  try {
    const confirmation=welcomeEmail(d.full_name,d.language);
    const ack=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{
        Authorization:'Bearer '+(process.env.GFT_RETAIL_RESEND_API_KEY||process.env.RESEND_API_KEY),
        'Content-Type':'application/json',
        'Idempotency-Key':'gft-retail-confirmation/'+d.id
      },
      body:JSON.stringify({
        from:WELCOME_FROM,to:[d.email],reply_to:'rcramer@iconx.io',
        subject:confirmation.subject,html:confirmation.html,text:confirmation.text
      }),
      signal:AbortSignal.timeout(9500)
    });
    const data=await ack.json().catch(()=>({}));
    if(ack.ok&&data.id)return {accepted:true,id:data.id,reason:null};
    const reason=String(data.message||data.name||('HTTP '+ack.status)).slice(0,180);
    console.error('GFT retail applicant confirmation rejected',ack.status,reason);
    return {accepted:false,id:null,reason};
  }catch(error){
    const reason=error instanceof Error?error.name:'transport';
    console.error('GFT retail applicant confirmation unavailable',reason);
    return {accepted:false,id:null,reason};
  }
}

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
  if(req.method==='GET'&&req.query?.health==='1'){
    if(req.query?.sender==='1'){
      if(!process.env.RESEND_API_KEY)return res.status(503).json({ok:false,verified:false,error:'sender config unavailable'});
      try{
        const verify=await fetch('https://api.resend.com/domains?limit=100',{
          headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'User-Agent':'Iconx-GFTRetail/1.0'},
          signal:AbortSignal.timeout(8000)
        });
        if(!verify.ok)return res.status(200).json({ok:true,checkAvailable:false,providerHttp:verify.status});
        const result=await verify.json();
        const root=(result.data||[]).find(d=>String(d.name||'').toLowerCase()==='iconx.io');
        return res.status(200).json({ok:true,checkAvailable:true,rootDomainVerified:root?.status==='verified',rootDomainStatus:root?.status||'not-listed',sendingEnabled:root?.capabilities?.sending==='enabled',hasMore:Boolean(result.has_more)});
      }catch{return res.status(200).json({ok:true,checkAvailable:false,error:'provider check unavailable'});}
    }
    return res.status(200).json({ok:true,ready:Boolean(process.env.RESEND_API_KEY),senderConfigured:Boolean(process.env.CONTACT_FROM_EMAIL||process.env.SAMPLE_FROM_EMAIL),applicantSenderKeyConfigured:Boolean(process.env.GFT_RETAIL_RESEND_API_KEY),transport:'Resend'});
  }
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
    retail_experience:clean(body.retail_experience,1600),
    submission_id:clean(body.submission_id,36),
    language:body.language==='es'?'es':'en'
  };
  const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.id)&&
    d.full_name.length>=2&&d.full_name.length<=150&&
    /^\S+@\S+\.\S+$/.test(d.email)&&d.email.length<=254&&
    d.mobile.replace(/\D/g,'').length>=7&&d.mobile.length<=40&&
    ['FL','NY'].includes(d.state)&&new RegExp('^'+d.state+'-\\d{2}$').test(d.territory)&&
    d.base_city.length>=2&&d.base_city.length<=120&&d.retail_experience.length<=1600&&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.submission_id);
  if(!valid)return res.status(400).json({ok:false,error:'Invalid application'});
  // Verify this is a saved GFT application before allowing a recipient-controlled welcome email.
  // The private row UUID plus original submission UUID are an unguessable server capability.
  try {
    const u=new URL('https://yxfqfrgjjbxagrioeqzz.supabase.co/functions/v1/gft-store-ambassador-apply');
    u.searchParams.set('verify_relay','1');u.searchParams.set('row_id',d.id);
    u.searchParams.set('submission_id',d.submission_id);u.searchParams.set('email',d.email);
    const check=await fetch(u,{signal:AbortSignal.timeout(8000)});
    const evidence=await check.json().catch(()=>({}));
    if(!check.ok||evidence.verified!==true)return res.status(403).json({ok:false,error:'Application not verified'});
    if(body.mode==='confirmation_only'&&evidence.recruitingSent!==true)
      return res.status(403).json({ok:false,error:'Recruiting notification not yet accepted'});
  }catch{return res.status(503).json({ok:false,error:'Unable to verify application'});}

  if(!process.env.RESEND_API_KEY)return res.status(503).json({ok:false,error:'Email service is not configured'});
  if(body.mode==='confirmation_only'){
    const welcome=await sendWelcome(d);
    return res.status(200).json({
      ok:true,emailed:true,confirmationAccepted:welcome.accepted,
      confirmationId:welcome.id,confirmationFailure:welcome.accepted?null:welcome.reason
    });
  }
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
    // Recruiting has been accepted; send a separately tracked applicant acknowledgment.
    const welcome=await sendWelcome(d);
    return res.status(200).json({
      ok:true,emailed:true,
      confirmationAccepted:welcome.accepted,
      confirmationId:welcome.id,
      confirmationFailure:welcome.accepted?null:welcome.reason
    });
  }catch(error){console.error('GFT Resend unavailable',error instanceof Error?error.name:'unknown');return res.status(503).json({ok:false,error:'Email service unavailable'});}
};