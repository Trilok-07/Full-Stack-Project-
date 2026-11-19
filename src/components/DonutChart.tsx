import React, { useEffect, useRef, useState } from 'react';
import { ExpenseCategory } from '../types/ledger';
import { CategorySlice, formatINR } from '../utils/calculations';

interface DonutChartProps {
  slices: CategorySlice[];
  totalSpent: number;
  selectedCategory: ExpenseCategory | null;
  onSelectCategory: (category: ExpenseCategory | null) => void;
  isDark: boolean;
}

interface SliceGeometry {
  slice: CategorySlice;
  startAngle: number;
  endAngle: number;
}

export function DonutChart({
  slices,
  totalSpent,
  selectedCategory,
  onSelectCategory,
  isDark,
}: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const geometriesRef = useRef<SliceGeometry[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<ExpenseCategory | null>(
    null
  );

  const activeCategory = hoveredCategory ?? selectedCategory;
  const activeSlice = slices.find((s) => s.category === activeCategory) ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 236;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const baseOuterRadius = 96;
    const innerRadius = 62;
    const separatorColor = isDark ? '#0f172a' : '#ffffff';

    if (slices.length === 0 || totalSpent <= 0) {
      geometriesRef.current = [];
      ctx.beginPath();
      ctx.arc(cx, cy, baseOuterRadius, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.fill();
      return;
    }

    const geometries: SliceGeometry[] = [];
    let currentAngle = -Math.PI / 2;
    const gapRadians = slices.length > 1 ? 0.022 : 0;

    for (const slice of slices) {
      const sweep = (slice.amount / totalSpent) * Math.PI * 2;
      const startAngle = currentAngle + gapRadians / 2;
      const endAngle = currentAngle + sweep - gapRadians / 2;
      geometries.push({
        slice,
        startAngle: currentAngle,
        endAngle: currentAngle + sweep,
      });

      const isHighlighted =
        hoveredCategory === slice.category || selectedCategory === slice.category;
      const isDimmed =
        (hoveredCategory !== null || selectedCategory !== null) && !isHighlighted;
      const outerRadius = isHighlighted ? baseOuterRadius + 6 : baseOuterRadius;

      ctx.save();
      ctx.globalAlpha = isDimmed ? 0.35 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, startAngle, Math.max(startAngle, endAngle));
      ctx.arc(
        cx,
        cy,
        innerRadius,
        Math.max(startAngle, endAngle),
        startAngle,
        true
      );
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      if (slices.length > 1) {
        ctx.strokeStyle = separatorColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      currentAngle += sweep;
    }

    geometriesRef.current = geometries;
  }, [slices, totalSpent, hoveredCategory, selectedCategory, isDark]);

  const hitTest = (e: React.MouseEvent<HTMLCanvasElement>): ExpenseCategory | null => {
    const canvas = canvasRef.current;
    if (!canvas || geometriesRef.current.length === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(x, y);

    if (distance < 58 || distance > 106) return null;

    let angle = Math.atan2(y, x);
    if (angle < -Math.PI / 2) {
      angle += Math.PI * 2;
    }

    for (const geo of geometriesRef.current) {
      if (angle >= geo.startAngle && angle <= geo.endAngle) {
        return geo.slice.category;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = hitTest(e);
    if (hit !== hoveredCategory) {
      setHoveredCategory(hit);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = hitTest(e);
    if (!hit) {
      if (selectedCategory) onSelectCategory(null);
      return;
    }
    onSelectCategory(selectedCategory === hit ? null : hit);
  };

  return (
    <section
      id="analytics"
      aria-label="Category Breakdown Donut Chart"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between h-full"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
            Expense Category Breakdown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hover a slice to inspect, or click to filter the ledger below.
          </p>
        </div>
        {selectedCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 my-auto">
        {/* HTML5 Canvas Donut Container */}
        <div className="relative shrink-0 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredCategory(null)}
            onClick={handleClick}
            className={hoveredCategory ? 'cursor-pointer' : 'cursor-default'}
            aria-label="Interactive expense category donut chart"
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[110px] truncate">
              {activeSlice ? activeSlice.category : 'Total Spent'}
            </span>
            <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-slate-50 mt-0.5">
              {formatINR(activeSlice ? activeSlice.amount : totalSpent)}
            </span>
            <span className="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {activeSlice
                ? `${activeSlice.percentage.toFixed(1)}% share`
                : `${slices.length} ${slices.length === 1 ? 'category' : 'categories'}`}
            </span>
          </div>
        </div>

        {/* Clean Unboxed Category Breakdown List */}
        <div className="w-full flex-1 min-w-0">
          {slices.length === 0 ? (
            <div className="py-6 text-center md:text-left">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No expenses recorded yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Log your first student expense to visualize category spending share.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {slices.map((slice) => {
                const isSelected = selectedCategory === slice.category;
                const isHovered = hoveredCategory === slice.category;
                return (
                  <li key={slice.category}>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredCategory(slice.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() =>
                        onSelectCategory(isSelected ? null : slice.category)
                      }
                      className={`w-full py-2 px-2 -mx-2 rounded-lg flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : isHovered
                            ? 'bg-slate-50 dark:bg-slate-800/50'
                            : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: slice.color }}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {slice.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 font-mono tabular-nums text-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatINR(slice.amount)}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 w-10 text-right">
                          {slice.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
