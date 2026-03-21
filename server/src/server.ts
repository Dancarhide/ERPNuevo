import app from './index';

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
});
