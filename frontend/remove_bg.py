import os, glob, re

dash_dir = r'c:\Users\ferro\OneDrive\Documentos\proyectos\ERP_Nuevo\ERPNuevo\frontend\src\app\dashboard'
files = glob.glob(os.path.join(dash_dir, '**', 'page.tsx'), recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('bg-[#F8F9FA]', 'bg-transparent').replace('bg-slate-50', 'bg-transparent')
    
    # Also remove the style pattern from dashboard/page.tsx
    if 'style={{ backgroundImage: bgPattern, backgroundRepeat: \'repeat\' }}' in new_content:
        new_content = new_content.replace('style={{ backgroundImage: bgPattern, backgroundRepeat: \'repeat\' }}', '')
        # Remove the bgPattern variable declaration if it exists
        new_content = re.sub(r'const bgPattern = `url\([^`]+\)`;\n?', '', new_content)

    if content != new_content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {file}')
