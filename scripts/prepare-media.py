"""Prepare supplied films for the local review. Originals are never modified."""
import json, subprocess, concurrent.futures
from pathlib import Path
SOURCE=Path('docs/compressed_noaudio')
choices=[
 ('car','hf_20260815_134620_a69b9b74-8634-4d77-b240-66644619a3ba.mp4',0,2),
 ('interior','Interior design firm ad (3).mp4',1,3),
 ('cafe','cafe ad 1.mp4',2,3),
 ('restaurant','restaurant ad 2.mp4',3,3),
 ('jewellery','Leora Jewellery Ad 2.mp4',4,3),
 ('mystery','Murder-mystery-1.hevc.mp4',5,3),
 ('film','movie-1.hevc_1.mp4',6,3),
]
def run(args):subprocess.run(['ffmpeg','-v','error','-threads','2',*args,'-y'],check=True)
def process(item):
 slug,filename,slot,seek=item; src=str(SOURCE/filename); dest=Path('public/media'); dest.mkdir(exist_ok=True)
 run(['-i',src,'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',str(dest/f'{slug}.mp4')])
 for suffix,width,crf in [('preview',1280,'25'),('mobile',720,'27')]:
  run(['-ss',str(seek),'-i',src,'-t','7','-an','-vf',f'scale={width}:-2','-c:v','libx264','-preset','fast','-crf',crf,'-pix_fmt','yuv420p','-movflags','+faststart',str(dest/f'{slug}-{suffix}.mp4')])
 run(['-ss',str(seek),'-i',src,'-frames:v','1','-c:v','libwebp','-quality','85',str(dest/f'{slug}.webp')])
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',src])); duration=float(probe['format']['duration'])
 return dict(id=slug,title=Path(filename).stem,thumbnail=f'/media/{slug}.webp',provider='hosted',videoUrl=f'/media/{slug}.mp4',previewUrl=f'/media/{slug}-preview.mp4',mobilePreviewUrl=f'/media/{slug}-mobile.mp4',duration=f'PT{round(duration)}S',featured=True,order=slot,heroSlide=slot,active=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex: videos=list(ex.map(process,choices))
Path('src/content/preview-videos.json').write_text(json.dumps(videos,indent=2)+'\n')
Path('docs/media-selection.md').write_text('# Supplied film selection\n\nThese are local preview records, not a hardcoded React video list. Firestore takes precedence when configured. Original filenames are retained as provisional video titles; no campaign names have been invented.\n\n'+'\n'.join(f'- `{a}` ← `{b}` (original hero message {c+1})' for a,b,c,d in choices)+'\n\nFull clips are H.264/AAC; background previews are silent, seven seconds long, with a separate 720px mobile encode. Two HEVC originals contain audio despite the folder name. Their full-player audio is preserved.\n')
print('Prepared',len(videos),'films and local preview metadata.')
