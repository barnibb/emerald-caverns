"""Erzeugt den Explosionsklang für Emerald Caverns vollständig synthetisch.
Zündschnur (0–0,9 s) + Knall bei 0,900 s + Nachhall/Trümmer bis 3,0 s.
Keine fremden Aufnahmen – Ergebnis wird unter CC0 1.0 gestellt."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR=32000; T=3.0; N=int(SR*T); rng=np.random.default_rng(20261114)
t=np.arange(N)/SR; out=np.zeros(N)
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],btype='band',fs=SR,output='sos'),x)
def lp(x,f): return sosfilt(butter(2,f,btype='low',fs=SR,output='sos'),x)
def hp(x,f): return sosfilt(butter(2,f,btype='high',fs=SR,output='sos'),x)
B=0.900
# Zündschnur: Zischen + Funkenknistern, wird lauter
fz=t<B; ramp=np.clip(t/B,0,1)
hiss=hp(rng.standard_normal(N),3500)*(0.01+0.02*ramp**1.5)*fz
cr=np.zeros(N)
for _ in range(170):
    s=int(rng.uniform(0.02,B-0.01)*SR); L=int(rng.uniform(.0015,.005)*SR)
    cr[s:s+L]+=rng.standard_normal(L)*np.exp(-np.arange(L)/(L/4))*rng.uniform(.04,.14)*(0.4+0.6*s/(B*SR))
out+=hiss+hp(cr,1800)
# Knall
k=np.clip(t-B,0,None); on=t>=B
click=rng.standard_normal(N)*np.exp(-k/0.006)*on
# Körper: Rauschen mit Tiefpass, der von hell nach dunkel fällt (stückweise gefiltert)
noise=rng.standard_normal(N); body=np.zeros(N)
edges=np.linspace(B,B+1.4,29)
for a,b in zip(edges[:-1],edges[1:]):
    f=200+5800*np.exp(-(a-B)/0.18); i0,i1=int(a*SR),int(b*SR)
    seg=lp(noise[max(0,i0-400):i1],f)[-(i1-i0):]; body[i0:i1]=seg
body*=np.exp(-k/0.33)*np.clip(k/0.003,0,1)*on
# Tiefer Druckstoß
freq=35+40*np.exp(-k/0.12); phase=2*np.pi*np.cumsum(freq)/SR
sub=np.sin(phase)*np.exp(-k/0.28)*np.clip(k/0.004,0,1)*on
# Grollen
rumble=lp(rng.standard_normal(N),260)*np.exp(-k/0.85)*on
# Trümmer: herabprasselnde Steinchen
deb=np.zeros(N)
for _ in range(90):
    s0=rng.uniform(B+0.08,2.6); s=int(s0*SR); L=int(rng.uniform(.004,.02)*SR); L=min(L,N-s)
    deb[s:s+L]+=bp(rng.standard_normal(L+64),500,4500)[-L:]*np.exp(-np.arange(L)/(L/5))*rng.uniform(.05,.25)*np.exp(-(s0-B)/0.8)
mix=out+0.55*click+0.9*body+1.0*sub+0.45*rumble+0.6*deb
mix=np.tanh(1.8*mix)/np.tanh(1.8)
mix*=np.minimum(1,(T-t)/0.25)          # Ausblenden
# Pegel an das bisherige Spielniveau anpassen: Knall-RMS ~0,16, Spitze höchstens 0,6
seg=mix[int(B*SR):int((B+.3)*SR)];mix*=0.16/np.sqrt((seg**2).mean())
if np.abs(mix).max()>0.6:mix*=0.6/np.abs(mix).max()
with wave.open('dynamite-explosion.wav','wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
win=int(.05*SR)
for i in range(0,N-win,win*2):
    r=np.sqrt((mix[i:i+win]**2).mean()); print(f"{i/SR:4.2f}s rms {r:.3f} {'#'*int(r*300)}")
