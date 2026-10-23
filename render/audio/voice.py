"""Voz femenina (es-419) con espeak-ng vía ctypes → arrays float32 @22050 Hz."""
import ctypes, numpy as np, espeakng_loader as L
lib=ctypes.CDLL(L.get_library_path())
CB=ctypes.CFUNCTYPE(ctypes.c_int,ctypes.POINTER(ctypes.c_short),ctypes.c_int,ctypes.c_void_p)
buf=[]
def _cb(w,n,e):
    if w and n>0: buf.append(np.ctypeslib.as_array(w,(n,)).copy())
    return 0
_c=CB(_cb)
lib.espeak_Initialize.restype=ctypes.c_int
SR=lib.espeak_Initialize(1,0,L.get_data_path().encode(),0)
lib.espeak_SetSynthCallback(_c)
def say(text,wpm=170,pitch=62,rng=55,voice='es-419+f4'):
    buf.clear()
    lib.espeak_SetVoiceByName(voice.encode())
    lib.espeak_SetParameter(1,int(wpm),0); lib.espeak_SetParameter(3,int(pitch),0); lib.espeak_SetParameter(4,int(rng),0)
    b=text.encode(); lib.espeak_Synth(b,len(b)+1,0,0,0,1,None,None); lib.espeak_Synchronize()
    return (np.concatenate(buf).astype(np.float32)/32768.0) if buf else np.zeros(1,np.float32)
if __name__=='__main__':
    print(SR)
    for t in ["¿Cuántas ventas pierdes cuando tu local cierra?","Cada vez más, se compra por internet.","Ciento veinticinco por ciento de crecimiento."]:
        for w in (150,175,200): print(w,round(len(say(t,w))/SR,2),t[:30])
