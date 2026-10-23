"""
Banda sonora completa, sintetizada con código:
  · voz femenina (espeak-ng es-419) sincronizada a cada escena
  · música astral (pads aditivos, brillo, campanas FM, delay y reverb)
  · efectos minimalistas sincronizados a cada animación del video
Salida: audio.wav (44.1 kHz, estéreo, 24 s)
"""
import sys, wave, numpy as np
from scipy import signal as sg
import voice

SR=44100; DUR=24.0; N=int(SR*DUR)
S=[0,3.4,7.8,12.6,18.8]                       # inicio de cada escena (igual que scene.html)
rng=np.random.default_rng(7)
TT=np.arange(N)/SR

def note(m): return 440*2**((m-69)/12)
def bus(): return np.zeros((2,N),np.float32)
def add(b,x,t0,g=1.0,pan=0.0):
    """mezcla x (mono) en el bus b desde t0, paneo -1..1 (ley de potencia constante)"""
    i=int(t0*SR)
    if i>=N or i+len(x)<=0: return
    a=max(0,-i); e=min(len(x),N-i); seg=x[a:e]*g
    th=(pan+1)*np.pi/4
    b[0,i+a:i+e]+=seg*np.cos(th); b[1,i+a:i+e]+=seg*np.sin(th)
def env_ad(n,a,d,curve=3.0):
    t=np.arange(n)/SR; e=np.minimum(t/max(a,1e-4),1)*np.exp(-t*curve/d); return e
def hp(x,f,o=2): return sg.sosfilt(sg.butter(o,f,'high',fs=SR,output='sos'),x)
def lp(x,f,o=2): return sg.sosfilt(sg.butter(o,f,'low',fs=SR,output='sos'),x)
def bp(x,f1,f2,o=2): return sg.sosfilt(sg.butter(o,[f1,f2],'band',fs=SR,output='sos'),x)

# ───────────────────────── reverb ─────────────────────────
def make_ir(rt60,pre=0.02,damp=6000,seed=1):
    r=np.random.default_rng(seed); n=int(SR*rt60*1.1)
    t=np.arange(n)/SR; ir=np.stack([r.standard_normal(n),r.standard_normal(n)])*np.exp(-6.9*t/rt60)
    # absorción de agudos creciente con el tiempo
    for c in range(2):
        a=lp(ir[c],damp,1); b=lp(ir[c],1200,1); w=np.clip(t/rt60,0,1); ir[c]=a*(1-w)+b*w
    ir[:,:int(pre*SR)]=0; ir/=np.sqrt((ir**2).sum(1,keepdims=True))
    return ir.astype(np.float32)
def reverb(b,ir):
    return np.stack([sg.fftconvolve(b[c],ir[c])[:N] for c in range(2)]).astype(np.float32)

# ───────────────────────── síntesis base ─────────────────────────
def pad_voice(f,dur,bright,detune=(-7,0,7)):
    n=int(dur*SR); t=np.arange(n)/SR; L=np.zeros(n);R=np.zeros(n)
    for k,dc in enumerate(detune):
        ff=f*2**(dc/1200); ph=rng.uniform(0,6.28); out=np.zeros(n)
        for h in range(1,9):
            if ff*h>7500: break
            out+=np.sin(2*np.pi*ff*h*t+ph*h)*(h**-1.15)*(bright**(h-1))
        out*=1+.08*np.sin(2*np.pi*(.11+.03*k)*t+k)
        if k==0:L+=out*1.0;R+=out*.45
        elif k==1:L+=out*.7;R+=out*.7
        else:L+=out*.45;R+=out*1.0
    return L,R
def chord(b,notes,t0,t1,bright=.7,g=.07,a=1.3,r=1.8):
    dur=(t1-t0)+r+.2; n=int(dur*SR); t=np.arange(n)/SR
    e=np.minimum(1,t/a); e=np.sin(e*np.pi/2)**2
    rel=np.clip((t-(t1-t0))/r,0,1); e*=np.cos(rel*np.pi/2)**2
    for m in notes:
        L,R=pad_voice(note(m),dur,bright)
        i=int(t0*SR);
        if i+n>N: n2=N-i
        else: n2=n
        b[0,i:i+n2]+=(L*e*g/len(notes)**.5)[:n2]; b[1,i:i+n2]+=(R*e*g/len(notes)**.5)[:n2]
def bell(f,dur=2.6,idx=2.2,ratio=3.5,tau=1.2):
    n=int(dur*SR); t=np.arange(n)/SR
    m=idx*np.exp(-t/(tau*.6))*np.sin(2*np.pi*f*ratio*t)
    y=np.sin(2*np.pi*f*t+m)*np.exp(-t/tau)+.25*np.sin(2*np.pi*f*2.01*t)*np.exp(-t/(tau*.5))
    y*=np.minimum(1,t/.004); return y
def sub_thump(dur=1.0,f0=90,f1=38,amp=1.0):
    n=int(dur*SR); t=np.arange(n)/SR; f=f1+(f0-f1)*np.exp(-t*9)
    ph=2*np.pi*np.cumsum(f)/SR; return np.sin(ph)*np.exp(-t*3.6)*amp*np.minimum(1,t/.003)
def noise(n): return rng.standard_normal(n).astype(np.float64)
def sweep_noise(dur,f_a,f_b,peak=.6,q=.55,shape=None):
    """ruido filtrado con centro que se desplaza de f_a a f_b (solapamiento Hann)"""
    n=int(dur*SR); x=noise(n+4096); L=2048; hop=1024; out=np.zeros(n+4096)
    frames=range(0,n,hop); w=np.hanning(L)
    for i in frames:
        p=i/max(n,1); f=f_a*(f_b/f_a)**p
        sos=sg.butter(2,[max(40,f*(1-q)),min(f*(1+q),SR/2-100)],'band',fs=SR,output='sos')
        seg=sg.sosfilt(sos,x[i:i+L]);
        if len(seg)<L: break
        out[i:i+L]+=seg*w
    out=out[:n]; t=np.linspace(0,1,n)
    e=np.sin(np.pi*np.clip(t/peak,0,1)*.5)**2 if shape is None else shape(t)
    e=np.where(t<peak,np.sin(np.pi/2*t/peak)**2,np.cos(np.pi/2*(t-peak)/(1-peak))**2)
    out*=e; return out/ (np.abs(out).max()+1e-9)
def tick(f=2400,dur=.05,sharp=60):
    n=int(dur*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*f*t)*np.exp(-t*sharp)*np.minimum(1,t/.0008)
def pop(f=520,dur=.18,glide=1.5):
    n=int(dur*SR); t=np.arange(n)/SR; ff=f*(1+glide*np.exp(-t*40)*.5)
    return np.sin(2*np.pi*np.cumsum(ff)/SR)*np.exp(-t*22)*np.minimum(1,t/.002)
def click(dur=.09):
    n=int(dur*SR); t=np.arange(n)/SR
    return (hp(noise(n),1800)*np.exp(-t*120)*.8+np.sin(2*np.pi*180*t)*np.exp(-t*60)*.9)
def keytick():
    n=int(.02*SR); t=np.arange(n)/SR
    return bp(noise(n),2200+rng.uniform(0,1500),6000)*np.exp(-t*260)

# ───────────────────────── voz ─────────────────────────
def eq_peak(x,f0,gdb,Q=1.0):
    A=10**(gdb/40); w=2*np.pi*f0/SR; al=np.sin(w)/(2*Q); c=np.cos(w)
    b=[1+al*A,-2*c,1-al*A]; a=[1+al/A,-2*c,1-al/A]; return sg.lfilter(b,a,x)
def trim(x,th=.012):
    idx=np.where(np.abs(x)>th)[0]; return x[idx[0]:idx[-1]+1] if len(idx) else x
LINES=[  # (texto, inicio, fin máx)
 ("¿Cuánto pierdes, cuando tu local cierra?",.55,3.30),
 ("Hoy, se compra por internet.",3.95,5.85),
 ("Creció ciento veinticinco por ciento.",5.95,8.10),
 ("Una tienda, que nunca cierra.",8.55,10.75),
 ("Mientras descansas, tu tienda vende.",11.00,13.25),
 ("Catálogo, pagos en dólares o bolívares, pedidos por WhatsApp, y panel de ventas.",13.45,18.60),
 ("Programada desde cero, a tu medida.",19.20,21.45),
 ("Cotiza tu tienda online.",21.70,23.30),
]
def render_voice():
    vb=bus(); env=np.zeros(N)
    for text,t0,t1 in LINES:
        wpm=158
        while True:
            y=trim(voice.say(text,wpm,pitch=66,rng=58)); d=len(y)/voice.SR
            if d<=(t1-t0) or wpm>=215: break
            wpm+=6
        print(f"  voz {t0:5.2f}s  {d:4.2f}s/{t1-t0:4.2f}s @{wpm}wpm  {text[:38]}")
        y=sg.resample_poly(y,2,1).astype(np.float64)
        y=hp(y,110); y=eq_peak(y,3400,3.5,.9); y=eq_peak(y,220,1.5,.8); y=eq_peak(y,7500,-2.5,1.0)
        y=np.tanh(1.5*y)/1.5; y/=np.abs(y).max()+1e-9; y*=.9
        fade=int(.012*SR); y[:fade]*=np.linspace(0,1,fade); y[-fade:]*=np.linspace(1,0,fade)
        add(vb,y,t0,1.0,0.0)
        # ecolito estéreo (Haas) para amplitud
        add(vb,y,t0+.018,.16,-.7); add(vb,y,t0+.027,.16,.7)
        i=int(t0*SR); env[i:i+len(y)]=np.maximum(env[i:i+len(y)],np.abs(y)[:N-i])
    return vb,env

# ───────────────────────── música ─────────────────────────
def render_music():
    pad=bus(); bells=bus(); sub=bus()
    # (inicio, fin, notas MIDI, brillo)  —  Am9 → Fmaj7#11 → Cmaj9 → Gadd9 → Dmaj9
    CH=[(0,3.4,[45,52,59,60,64],.50),
        (3.4,7.8,[41,48,52,57,59,64],.66),
        (7.8,12.6,[48,55,62,64,71],.74),
        (12.6,18.8,[43,50,57,59,64,69],.78),
        (18.8,25.0,[50,57,64,66,73,78],.86)]
    for t0,t1,ns,br in CH:
        a=1.8 if t0==0 else 1.1
        chord(pad,ns,max(0,t0-.7) if t0>0 else 0,t1+(.0),br,.085,a=a,r=1.8)
    # capa de brillo (octavas altas, muy suave)
    shim=bus()
    for t0,t1,ns,br in CH:
        for m in ns[1:4]:
            L,R=pad_voice(note(m+24),(t1-t0)+2.2,.5); n=len(L); t=np.arange(n)/SR
            e=np.sin(np.clip(t/1.6,0,1)*np.pi/2)**2*np.cos(np.clip((t-(t1-t0))/2.2,0,1)*np.pi/2)**2
            i=int(max(0,t0-.4)*SR); n2=min(n,N-i)
            shim[0,i:i+n2]+=(L*e*.012)[:n2]; shim[1,i:i+n2]+=(R*e*.012)[:n2]
    # sub grave que sigue la raíz
    for (t0,t1,ns,br),r in zip(CH,[33,29,36,31,38]):
        n=int((t1-t0+1.5)*SR); t=np.arange(n)/SR; e=np.sin(np.clip(t/1.5,0,1)*np.pi/2)**2*np.cos(np.clip((t-(t1-t0))/1.5,0,1)*np.pi/2)**2
        x=np.sin(2*np.pi*note(r)*t)*e*.1; i=int(max(0,t0-.5)*SR); n2=min(n,N-i); sub[0,i:i+n2]+=x[:n2]; sub[1,i:i+n2]+=x[:n2]
    # arpegio de campanas
    r=np.random.default_rng(3)
    def arp(ts,t_end,step,ns,vel,oct=1):
        k=0; t=ts
        pat=[0,2,1,3,2,4,3,1]
        while t<t_end:
            m=ns[pat[k%len(pat)]%len(ns)]+12*(oct+(1 if (k%8)>=5 else 0)); k+=1
            add(bells,bell(note(m)),t,vel*(.8+.2*r.random()),pan=r.uniform(-.6,.6)); t+=step
    arp(3.95,7.7,.6,[57,59,64,69,72,76],.05)
    arp(8.1,12.5,.6,[60,64,67,71,74,76],.055)
    arp(13.1,18.6,.3,[55,59,62,67,69,71],.04,oct=1)
    arp(19.1,22.6,.3,[62,66,69,73,76,78],.05,oct=1)
    # acorde final de campanas (resolución)
    for i,m in enumerate([74,78,81,85,86]): add(bells,bell(note(m),dur=3.0,tau=1.6),22.75+i*.07,.05,pan=-.5+i*.25)
    return pad,shim,sub,bells

# ───────────────────────── efectos ─────────────────────────
def render_sfx():
    sx=bus(); sw=bus()                         # sx = directo, sw = envío a reverb
    def hit(t,power=1.0,pan=0):
        add(sx,sub_thump(1.1,95,36,.55*power),t,1,0)
        add(sw,bell(note(93),dur=2.2,idx=1.4,tau=.8),t,.04*power,pan)
        add(sw,bell(note(81),dur=2.4,idx=1.2,tau=.9),t+.02,.05*power,-pan)
        add(sx,hp(noise(int(.35*SR)),2500)*env_ad(int(.35*SR),.001,.12,4),t,.05*power,0)
    # arranque
    add(sx,sweep_noise(1.0,300,5000,peak=.95)*.07,0,1,0)
    # reloj
    add(sx,tick(1800,.06,45),.95,.25,.1); add(sw,bell(note(88),dur=1.4,tau=.5),.95,.02,.3)
    add(sx,sub_thump(1.6,70,30,.8),1.75,1,0)                        # local cierra
    add(sw,bell(note(63),dur=2.6,idx=2.8,tau=1.5),1.75,.06,-.2); add(sw,bell(note(69),dur=2.6,idx=2.8,tau=1.5),1.77,.05,.2)
    n=int(.5*SR); add(sx,lp(noise(n),240)*env_ad(n,.01,.35,3)*.5,1.75,.35,0)  # temblor
    # transiciones de escena
    for k,p in zip(range(1,5),[.8,.8,.9,1.25]):
        t=S[k]-.1
        add(sx,sweep_noise(.62,500,7500,peak=.8)*.22,t,1,0)
        add(sw,sweep_noise(.62,500,7500,peak=.8)*.1,t,1,0)
        hit(S[k]+.4,p)
    # escena 2: gráfica + contador
    t0=S[1]+.85; n=int(1.5*SR); tt=np.arange(n)/SR; f=380*(5.5**(tt/1.5))
    scan=np.sin(2*np.pi*np.cumsum(f)/SR)*np.minimum(1,tt/.05)*np.minimum(1,(1.5-tt)/.12)*(0.5+.5*np.sin(2*np.pi*14*tt))
    add(sx,scan*.04,t0,1,.2)
    for i in range(24): add(sx,tick(1200+i*55,.03,90),t0+i*1.5/24,.07,-.3+.6*i/24)
    add(sw,bell(note(100),dur=2,idx=1.6,tau=.7),t0+1.5,.06,0); add(sx,pop(880,.2),t0+1.5,.12,0)
    # escena 3: teléfono
    for rel,fr in [(.6,1500),(.8,1700)]: add(sx,tick(fr,.04,70),S[2]+rel,.12,.0)
    for i,rel in enumerate([.95,1.1,1.25,1.4]): add(sx,pop(420+i*70,.14),S[2]+rel,.16,-.5+i*.33)
    add(sx,pop(700,.22),S[2]+1.55,.22,0)
    for rel in (1.7,2.45):
        add(sw,bell(note(84),dur=1.6,idx=.6,tau=.5),S[2]+rel,.03,0)
    add(sx,sweep_noise(.75,900,3500,peak=.6,q=.35)*.1,S[2]+1.75,1,.2)       # cursor
    add(sx,click(),S[2]+2.6,.55,0)
    add(sw,bell(note(88),dur=2,idx=1.2,tau=.8),S[2]+2.85,.07,.3); add(sw,bell(note(95),dur=2.4,idx=1.2,tau=1.0),S[2]+2.97,.07,-.3)
    add(sx,pop(1250,.15),S[2]+2.85,.1,0)
    # escena 4: filas que emergen del teléfono
    for i,rel in enumerate([.8,1.55,2.3,3.05,3.8]):
        t=S[3]+rel
        add(sx,sweep_noise(.4,2500,700,peak=.4,q=.5)*.07,t,1,-.2+.1*i)   # sale del teléfono
        m=[69,72,74,76,79][i]
        add(sx,pop(note(m-12),.2),t+.38,.2,0)
        add(sw,bell(note(m+12),dur=1.5,idx=1.0,tau=.6),t+.38,.045,.2*(i-2)/2)
        add(sx,tick(3200,.03,100),t+.55,.08,.3)
    # escena 5: marco y tecleo
    for i in range(4): add(sx,tick(1600+i*300,.04,70),S[4]+1.15+i*.035,.12,-.6+.4*i)
    for i in range(11): add(sx,keytick(),S[4]+.95+i*.07,.06*(.6+.4*rng.random()),0)
    add(sx,sweep_noise(.7,350,4200,peak=.8)*.14,S[4]+2.5,1,0)
    hit(S[4]+3.15,.7)
    add(sx,sweep_noise(.8,1000,3500,peak=.6,q=.3)*.08,S[4]+2.4,1,.3)       # cursor
    add(sx,click(),S[4]+3.75,.6,.2)
    for i,m in enumerate([81,86,90,93]): add(sw,bell(note(m),dur=2.8,idx=1.2,tau=1.2),S[4]+3.78+i*.06,.05,-.4+.27*i)
    # cierre
    add(sx,sweep_noise(.9,6000,600,peak=.15)*.05,23.0,1,0)
    return sx,sw

# ───────────────────────── mezcla ─────────────────────────
def main():
    print("voz…"); vb,venv=render_voice()
    print("música…"); pad,shim,sub,bells=render_music()
    print("efectos…"); sx,sw=render_sfx()

    # delay ping-pong para campanas
    def pingpong(b,dt=.375,fb=.42,n=5):
        out=b.copy(); d=int(dt*SR)
        for k in range(1,n+1):
            sh=d*k
            if sh>=N: break
            g=fb**k
            if k%2: out[1,sh:]+=b[0,:N-sh]*g; out[0,sh:]+=b[1,:N-sh]*g*.5
            else:   out[0,sh:]+=b[0,:N-sh]*g; out[1,sh:]+=b[1,:N-sh]*g
        return out
    bells_d=pingpong(bells)

    ir_big=make_ir(5.0,.03,6500,1); ir_mid=make_ir(2.6,.015,7000,2); ir_vox=make_ir(1.5,.012,8000,3)
    wet_music=reverb(pad*.7+shim*1.2+bells_d*1.0,ir_big)
    wet_sfx=reverb(sw+sx*.25,ir_mid)
    wet_vox=reverb(vb,ir_vox)

    music=pad*.8+shim+sub+bells_d*.9+wet_music*.9
    # ducking de música/sfx bajo la voz
    e=sg.sosfilt(sg.butter(2,6,'low',fs=SR,output='sos'),venv); e=np.clip(e/ (e.max()+1e-9)*2.4,0,1)
    duck=1-.42*e; duck_s=1-.2*e
    voice_mix=vb+wet_vox*.42
    sfx_mix=(sx+sw*.6+wet_sfx*.9)
    mix=voice_mix*1.0 + music*duck*.62 + sfx_mix*duck_s*1.5

    act=venv>.02
    r=lambda x:20*np.log10(np.sqrt((x[:,act]**2).mean())+1e-9)
    print('en voz: voz %.1f  musica %.1f  sfx %.1f dB'%(r(voice_mix),r(music*duck),r(sfx_mix*duck_s)))
    # pequeño "aire" de 20 Hz fuera, fade global
    mix=np.stack([hp(mix[c],28,2) for c in range(2)])
    fin=np.clip(TT/.35,0,1); fout=np.clip((DUR-TT)/.9,0,1)
    mix*=(np.sin(fin*np.pi/2)**2*np.sin(fout*np.pi/2)**2)
    # normalización a -1 dBFS con limitador suave
    mix/=np.percentile(np.abs(mix),99.9)*1.18
    mix=np.tanh(mix*1.1)/np.tanh(1.1); mix*=.5/np.abs(mix).max()
    rms=np.sqrt((mix**2).mean()); print("pico",np.abs(mix).max(),"rms dBFS",20*np.log10(rms))
    pcm=(mix.T*32767).astype('<i2')
    with wave.open('audio.wav','wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    # voz sola, para diagnóstico/uso aparte
    v=vb[0]/ (np.abs(vb[0]).max()+1e-9)*.9
    with wave.open('voz.wav','wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v*32767).astype('<i2').tobytes())
if __name__=='__main__': main()
