import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

// ── Foto de empleado ────────────────────────────────────────────────────────
const fotoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(STORAGE_ROOT, 'fotos');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req: Request, file, cb) => {
        const id = req.params.id || 'unknown';
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `emp_${id}${ext}`);
    }
});

const fotoFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
    }
};

export const uploadFoto = multer({
    storage: fotoStorage,
    fileFilter: fotoFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ── CV de candidato ─────────────────────────────────────────────────────────
const cvStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(STORAGE_ROOT, 'cvs');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req: Request, file, cb) => {
        const id = req.params.id || 'unknown';
        const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
        cb(null, `cv_${id}${ext}`);
    }
});

const cvFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF'));
    }
};

export const uploadCV = multer({
    storage: cvStorage,
    fileFilter: cvFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});
