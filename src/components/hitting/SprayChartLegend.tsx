export function SprayChartLegend() {
  return (
    <div className="flex justify-center gap-4 mt-4 text-xs">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-spray-single" /> 1B
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-spray-double" /> 2B
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-spray-triple" /> 3B
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-spray-hr" /> HR
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-spray-out" /> Out
      </span>
    </div>
  );
}
