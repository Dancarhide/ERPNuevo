-- Script para poblar la Base de Datos "ERP" inicial.
-- Puedes ejecutar esto desde PgAdmin (Query Tool).
-- NOTA: La contraseña por defecto para todos los usuarios será: '12345'

-- 1. Insertar Áreas
INSERT INTO areas (idarea, nombre_area) OVERRIDING SYSTEM VALUE VALUES 
(9, 'Dirección General'),
(10, 'Producción'),
(11, 'Recursos Humanos'),
(12, 'Administración')
ON CONFLICT (idarea) DO NOTHING;

-- Si idarea no tiene UNIQUE constraint, omitimos ON CONFLICT y usamos TRUNCATE si es necesario:
-- En su lugar, usaremos simples INSERTs. Si falla por id repetido, ignora.

-- 2. Insertar Roles (ID 6, 7, 8, 9, 10 según la estructura previa)
INSERT INTO roles (idrol, nombre_rol, desc_rol, idarea) OVERRIDING SYSTEM VALUE VALUES 
(6, 'Director', 'Alta Dirección', 9),
(7, 'Gerente', 'Gerencia General', 10),
(8, 'Recursos Humanos', 'Gestión de personal', 11),
(9, 'Operativo', 'Personal de Producción', 10),
(10, 'Auxiliar', 'Apoyo general', 12)
ON CONFLICT DO NOTHING;

-- 3. Insertar Empleados de prueba
-- Usaremos la secuencia pero si queremos ids fijos no es necesario, insertemos y relacionemos.
-- PostgreSQL auto-incrementará 'idempleado'. 
-- Las contraseñas se agregan en la tabla 'credenciales'.

DO $$
DECLARE 
   emb1 INT; emb2 INT; emb3 INT; emb4 INT; emb5 INT; emb6 INT; emb7 INT;
BEGIN
    INSERT INTO empleados (nombre_completo_empleado, email_empleado, idrol, idarea, estatus_empleado, sueldo, puesto, dias_vacaciones_disponibles)
    VALUES ('Super Administrador', 'admin@erp.com', 8, 11, 'Activo', 20000.00, 'RH', 12) RETURNING idempleado INTO emb1;
    
    INSERT INTO empleados (nombre_completo_empleado, email_empleado, idrol, idarea, estatus_empleado, sueldo, puesto, dias_vacaciones_disponibles)
    VALUES ('Juan Pérez', 'director@erp.com', 6, 9, 'Activo', 50000.00, 'Director', 12) RETURNING idempleado INTO emb2;

    INSERT INTO empleados (nombre_completo_empleado, email_empleado, idrol, idarea, estatus_empleado, sueldo, puesto, dias_vacaciones_disponibles)
    VALUES ('María López', 'gerente@erp.com', 7, 10, 'Activo', 25000.00, 'Gerente', 12) RETURNING idempleado INTO emb3;

    INSERT INTO empleados (nombre_completo_empleado, email_empleado, idrol, idarea, estatus_empleado, sueldo, puesto, dias_vacaciones_disponibles)
    VALUES ('Carlos Ruiz', 'operativo@erp.com', 9, 10, 'Activo', 15000.00, 'Operador', 12) RETURNING idempleado INTO emb4;

    INSERT INTO empleados (nombre_completo_empleado, email_empleado, idrol, idarea, estatus_empleado, sueldo, puesto, dias_vacaciones_disponibles)
    VALUES ('Roberto Gómez', 'ausente@erp.com', 9, 10, 'Vacaciones', 15000.00, 'Tapicero', 0) RETURNING idempleado INTO emb5;

    INSERT INTO empleados (nombre_completo_empleado, email_empleado, idrol, idarea, estatus_empleado, sueldo, puesto, dias_vacaciones_disponibles)
    VALUES ('Pedro Sánchez', 'auxiliar@erp.com', 10, 12, 'Activo', 12000.00, 'Auxiliar', 12) RETURNING idempleado INTO emb6;

    INSERT INTO empleados (nombre_completo_empleado, email_empleado, idrol, idarea, estatus_empleado, sueldo, puesto, dias_vacaciones_disponibles)
    VALUES ('Empleado Prueba', 'prueba@erp.com', 9, 10, 'Inactivo', 15000.00, 'General', 12) RETURNING idempleado INTO emb7;

    -- 4. Insertar Credenciales
    -- Clave secreta bcrypt para "12345"
    INSERT INTO credenciales (idempleado, username, user_password) VALUES (emb1, 'admin', '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq') ON CONFLICT (username) DO NOTHING;
    INSERT INTO credenciales (idempleado, username, user_password) VALUES (emb2, 'juan.perez', '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq') ON CONFLICT (username) DO NOTHING;
    INSERT INTO credenciales (idempleado, username, user_password) VALUES (emb3, 'maria.lopez', '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq') ON CONFLICT (username) DO NOTHING;
    INSERT INTO credenciales (idempleado, username, user_password) VALUES (emb4, 'carlos.ruiz', '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq') ON CONFLICT (username) DO NOTHING;
    INSERT INTO credenciales (idempleado, username, user_password) VALUES (emb5, 'roberto.gomez', '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq') ON CONFLICT (username) DO NOTHING;
    INSERT INTO credenciales (idempleado, username, user_password) VALUES (emb6, 'pedro.sanchez', '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq') ON CONFLICT (username) DO NOTHING;
    INSERT INTO credenciales (idempleado, username, user_password) VALUES (emb7, 'empleado.prueba', '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq') ON CONFLICT (username) DO NOTHING;
END $$;