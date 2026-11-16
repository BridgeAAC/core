from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'AppIcon.png'
ANDROID = ROOT / 'resources' / 'android' / 'res'
APPLE = ROOT / 'apple' / 'Assets.xcassets' / 'AppIcon.appiconset'
WHITE = (255, 255, 255)
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
SPLASH = {
    'drawable': (480, 320),
    'drawable-land-mdpi': (480, 320),
    'drawable-land-hdpi': (800, 480),
    'drawable-land-xhdpi': (1280, 720),
    'drawable-land-xxhdpi': (1600, 960),
    'drawable-land-xxxhdpi': (1920, 1280),
    'drawable-port-mdpi': (320, 480),
    'drawable-port-hdpi': (480, 800),
    'drawable-port-xhdpi': (720, 1280),
    'drawable-port-xxhdpi': (960, 1600),
    'drawable-port-xxxhdpi': (1280, 1920),
}


def save(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def round_icon(icon):
    mask = Image.new('L', icon.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, icon.size[0] - 1, icon.size[1] - 1), fill=255)
    out = Image.new('RGBA', icon.size, (0, 0, 0, 0))
    out.paste(icon, (0, 0), mask)
    return out


def foreground(icon, size):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    inner = round(size * 0.7)
    offset = (size - inner) // 2
    canvas.paste(icon.resize((inner, inner), Image.LANCZOS), (offset, offset))
    return canvas


def splash(icon, width, height):
    canvas = Image.new('RGB', (width, height), WHITE)
    side = round(min(width, height) * 0.45)
    canvas.paste(icon.resize((side, side), Image.LANCZOS), ((width - side) // 2, (height - side) // 2))
    return canvas


def main():
    icon = Image.open(SOURCE).convert('RGB')
    save(icon, APPLE / 'AppIcon-1024.png')
    for name, scale in DENSITIES.items():
        legacy = icon.resize((round(48 * scale), round(48 * scale)), Image.LANCZOS)
        save(legacy, ANDROID / f'mipmap-{name}' / 'ic_launcher.png')
        save(round_icon(legacy), ANDROID / f'mipmap-{name}' / 'ic_launcher_round.png')
        save(foreground(icon, round(108 * scale)), ANDROID / f'mipmap-{name}' / 'ic_launcher_foreground.png')
    for folder, (width, height) in SPLASH.items():
        save(splash(icon, width, height), ANDROID / folder / 'splash.png')
    print('App icons written')


if __name__ == '__main__':
    main()
