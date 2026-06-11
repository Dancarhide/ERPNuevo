/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const srcDir =
  'c:\\\\Users\\\\ferro\\\\OneDrive\\\\Documentos\\\\proyectos\\\\ERP_Nuevo\\\\ERPNuevo\\\\viejo\\\\src\\\\views';
const destDir =
  'c:\\\\Users\\\\ferro\\\\OneDrive\\\\Documentos\\\\proyectos\\\\ERP_Nuevo\\\\ERPNuevo\\\\frontend\\\\src\\\\app\\\\dashboard';

const mapping = [
  {
    src: 'GestionTalento.tsx',
    dest: 'estructura/page.tsx',
    cssSrc: 'styles/GestionTalento.css',
    cssDest: 'estructura/GestionTalento.css',
    cssImportOriginal: './styles/GestionTalento.css',
    cssImportNew: './GestionTalento.css',
  },
  {
    src: 'EvaluacionesDesempeno.tsx',
    dest: 'evaluaciones/page.tsx',
    cssSrc: 'styles/Incidencias.css',
    cssDest: 'evaluaciones/Incidencias.css',
    cssImportOriginal: './styles/Incidencias.css',
    cssImportNew: './Incidencias.css',
  },
  {
    src: 'ClimateSurvey.tsx',
    dest: 'clima-laboral/page.tsx',
    cssSrc: 'styles/Dashboard.css',
    cssDest: 'clima-laboral/Dashboard.css',
    cssImportOriginal: './styles/Dashboard.css',
    cssImportNew: './Dashboard.css',
  },
  {
    src: 'SurveyAdmin.tsx',
    dest: 'admin-encuestas/page.tsx',
    cssSrc: 'styles/Dashboard.css',
    cssDest: 'admin-encuestas/Dashboard.css',
    cssImportOriginal: './styles/Dashboard.css',
    cssImportNew: './Dashboard.css',
  },
];

for (const map of mapping) {
  const srcPath = path.join(srcDir, map.src);
  const destPath = path.join(destDir, map.dest);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  let content = fs.readFileSync(srcPath, 'utf8');

  // add use client
  content = '"use client";\n' + content;

  // replace imports
  content = content.replace(
    /import client from '\.\.\/api\/client';/g,
    "import client from '@/lib/legacy-client';"
  );
  content = content.replace(/import '\.\/styles\/.*';/g, "import '" + map.cssImportNew + "';");

  fs.writeFileSync(destPath, content);
  console.log('Copied ' + map.src);

  const cssSrcPath = path.join(srcDir, map.cssSrc);
  const cssDestPath = path.join(destDir, map.cssDest);

  if (fs.existsSync(cssSrcPath)) {
    fs.copyFileSync(cssSrcPath, cssDestPath);
    console.log('Copied ' + map.cssSrc);
  }
}
console.log('Migration done.');
