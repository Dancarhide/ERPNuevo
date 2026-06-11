export function ActividadRecienteWidget() {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full">
      <h2 className="text-[1.5rem] font-bold text-[#44474A] m-0 pb-5 border-b-2 border-[#F3F4F6] tracking-[-0.02em] mb-6">
        Actividad Reciente
      </h2>
      <div className="flex flex-col gap-5">
        <div className="flex justify-between pb-5 border-b border-[#F3F4F6]">
          <span className="text-[#44474A] font-semibold text-[1rem]">Módulo en construcción</span>
          <span className="text-[#858789] text-[0.9rem] font-medium">--:--</span>
        </div>
      </div>
    </div>
  );
}
