from PIL import Image, ImageDraw, ImageFont
import os

out_dir = r"C:\Users\nguag\OneDrive\Desktop\projects\game-vr\store-assets"
os.makedirs(out_dir, exist_ok=True)

title = "VR Target Shooter"
sub = "Fast-paced VR shooting action"

def make_bg(draw, w, h):
    for i in range(h):
        r = int(13 + (20 - 13) * i / h)
        g = int(27 + (50 - 27) * i / h)
        b = int(42 + (80 - 42) * i / h)
        draw.line([(0, i), (w, i)], fill=(r, g, b))

def make_grid(draw, w, h, step=80):
    for x in range(0, w, step):
        draw.line([(x, 0), (x, h)], fill=(0, 80, 50), width=1)
    for y in range(0, h, step):
        draw.line([(0, y), (w, y)], fill=(0, 80, 50), width=1)

def make_crosshair(draw, cx, cy, scale=1.0):
    s = scale
    draw.ellipse([cx-int(60*s), cy-int(60*s), cx+int(60*s), cy+int(60*s)], outline="#00ff88", width=max(2,int(4*s)))
    draw.ellipse([cx-int(30*s), cy-int(30*s), cx+int(30*s), cy+int(30*s)], outline="#00ff88", width=max(2,int(3*s)))
    draw.ellipse([cx-int(6*s), cy-int(6*s), cx+int(6*s), cy+int(6*s)], fill="#00ff88")

def make_targets(draw, targets):
    for tx, ty, tr, tc in targets:
        draw.ellipse([tx-tr, ty-tr, tx+tr, ty+tr], outline=tc, width=5)
        draw.ellipse([tx-tr+18, ty-tr+18, tx+tr-18, ty+tr-18], outline=tc, width=3)
        draw.ellipse([tx-6, ty-6, tx+6, ty+6], fill=tc)

def get_font(size):
    for name in ["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except:
            pass
    return ImageFont.load_default()

def get_font_regular(size):
    for name in ["arial.ttf", "Arial.ttf", "DejaVuSans.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except:
            pass
    return ImageFont.load_default()

def center_text(draw, text, font, y, w, fill="#00ff88", shadow=True):
    bb = draw.textbbox((0, 0), text, font=font)
    tw = bb[2] - bb[0]
    tx = (w - tw) // 2
    if shadow:
        draw.text((tx+3, y+3), text, fill=(0, 40, 20), font=font)
    draw.text((tx, y), text, fill=fill, font=font)

# 1. Landscape 2560x1440
w, h = 2560, 1440
img = Image.new("RGB", (w, h), (13, 27, 42))
d = ImageDraw.Draw(img)
make_bg(d, w, h)
make_grid(d, w, h)
make_crosshair(d, w//2, h//2 - 80)
make_targets(d, [(400,350,110,"#e94560"),(2100,300,80,"#2ed573"),(1850,950,90,"#1e90ff"),(500,1050,70,"#ffa502"),(2200,1100,65,"#a855f7")])
center_text(d, title, get_font(120), h//2+60, w)
center_text(d, sub, get_font_regular(48), h//2+200, w, fill="#88ccaa", shadow=False)
img.save(os.path.join(out_dir, "landscape-2560x1440.png"), "PNG")
print("1/5 landscape done")

# 2. Square 1440x1440
w2, h2 = 1440, 1440
img2 = Image.new("RGB", (w2, h2), (13, 27, 42))
d2 = ImageDraw.Draw(img2)
make_bg(d2, w2, h2)
make_grid(d2, w2, h2)
make_crosshair(d2, w2//2, h2//2-120, 0.8)
make_targets(d2, [(250,280,75,"#e94560"),(1180,250,55,"#2ed573"),(1100,1050,65,"#1e90ff"),(300,1100,50,"#ffa502")])
center_text(d2, title, get_font(88), h2//2+30, w2)
center_text(d2, sub, get_font_regular(36), h2//2+140, w2, fill="#88ccaa", shadow=False)
img2.save(os.path.join(out_dir, "square-1440x1440.png"), "PNG")
print("2/5 square done")

# 3. Portrait 1008x1440
w3, h3 = 1008, 1440
img3 = Image.new("RGB", (w3, h3), (13, 27, 42))
d3 = ImageDraw.Draw(img3)
make_bg(d3, w3, h3)
make_grid(d3, w3, h3, 60)
make_crosshair(d3, w3//2, h3//2-180, 0.7)
make_targets(d3, [(150,280,55,"#e94560"),(850,350,45,"#2ed573"),(780,1100,50,"#1e90ff")])
ft3 = get_font(70)
for line, yoff in [("VR Target", 0), ("Shooter", 85)]:
    center_text(d3, line, ft3, h3//2+30+yoff, w3)
center_text(d3, sub, get_font_regular(28), h3//2+230, w3, fill="#88ccaa", shadow=False)
img3.save(os.path.join(out_dir, "portrait-1008x1440.png"), "PNG")
print("3/5 portrait done")

# 4. Hero 3000x900
w4, h4 = 3000, 900
img4 = Image.new("RGB", (w4, h4), (13, 27, 42))
d4 = ImageDraw.Draw(img4)
make_bg(d4, w4, h4)
make_grid(d4, w4, h4, 100)
make_crosshair(d4, w4//2, h4//2-100, 0.7)
make_targets(d4, [(400,280,65,"#e94560"),(2600,220,50,"#2ed573"),(2400,650,55,"#1e90ff"),(550,600,45,"#ffa502")])
center_text(d4, title, get_font(96), h4//2, w4)
center_text(d4, sub, get_font_regular(38), h4//2+120, w4, fill="#88ccaa", shadow=False)
img4.save(os.path.join(out_dir, "hero-3000x900.png"), "PNG")
print("4/5 hero done")

# 5. Icon 512x512 (solid bg, no transparency)
w5 = 512
img5 = Image.new("RGB", (w5, w5), (13, 27, 42))
d5 = ImageDraw.Draw(img5)
make_crosshair(d5, w5//2, w5//2-40, 1.5)
fi = get_font(46)
center_text(d5, "VR TARGET", fi, 330, w5, shadow=False)
center_text(d5, "SHOOTER", fi, 382, w5, shadow=False)
img5.save(os.path.join(out_dir, "icon-512x512.png"), "PNG")
print("5/5 icon done")

print(f"\nAll assets saved to: {out_dir}")
for f in os.listdir(out_dir):
    fp = os.path.join(out_dir, f)
    sz = os.path.getsize(fp)
    print(f"  {f} ({sz//1024}KB)")
