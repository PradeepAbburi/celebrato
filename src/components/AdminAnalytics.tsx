import React, { useState, useMemo } from 'react';
import { Booking, Room, AddOnItem } from '../types';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  Sparkles, 
  Layers, 
  Building, 
  Clock, 
  BarChart3,
  CheckCircle2,
  Radio,
  Tag,
  AlertCircle
} from 'lucide-react';

interface AdminAnalyticsProps {
  bookings: Booking[];
  rooms: Room[];
  addons: AddOnItem[];
}

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ChartPoint {
  label: string;
  revenue: number;
  bookingsCount: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  bookings,
  rooms,
  addons,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ── 100% REAL-TIME FIRESTORE DATA CALCULATIONS (NO MOCK DATA) ──
  const chartData: ChartPoint[] = useMemo(() => {
    // 1. Daily: Exact last 14 days
    if (timeframe === 'daily') {
      const days: ChartPoint[] = [];
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const matching = bookings.filter((b) => {
          const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
          return bDate === dateStr;
        });

        const rev = matching.reduce((sum, b) => sum + (b.status !== 'cancelled' ? (b.finalPrice || 0) : 0), 0);
        const confirmed = matching.filter((b) => b.status === 'confirmed').length;
        const completed = matching.filter((b) => b.status === 'completed' || b.status === 'checked-in').length;
        const cancelled = matching.filter((b) => b.status === 'cancelled').length;

        days.push({
          label: dayLabel,
          revenue: rev,
          bookingsCount: matching.length,
          confirmed,
          completed,
          cancelled,
        });
      }
      return days;
    }

    // 2. Weekly: Exact last 8 calendar weeks
    if (timeframe === 'weekly') {
      const weeks: ChartPoint[] = [];
      const now = new Date();
      for (let w = 7; w >= 0; w--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (w * 7));
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        const label = w === 0 ? 'This Wk' : `Wk -${w}`;

        const matching = bookings.filter((b) => {
          const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
          return bDate >= weekStartStr && bDate <= weekEndStr;
        });

        const rev = matching.reduce((sum, b) => sum + (b.status !== 'cancelled' ? (b.finalPrice || 0) : 0), 0);
        const confirmed = matching.filter((b) => b.status === 'confirmed').length;
        const completed = matching.filter((b) => b.status === 'completed' || b.status === 'checked-in').length;
        const cancelled = matching.filter((b) => b.status === 'cancelled').length;

        weeks.push({
          label,
          revenue: rev,
          bookingsCount: matching.length,
          confirmed,
          completed,
          cancelled,
        });
      }
      return weeks;
    }

    // 3. Monthly: All 12 months of the active year
    if (timeframe === 'monthly') {
      const currentYear = new Date().getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, idx) => {
        const matching = bookings.filter((b) => {
          const dateVal = b.date || b.createdAt;
          if (!dateVal) return false;
          const bDate = new Date(dateVal);
          return bDate.getFullYear() === currentYear && bDate.getMonth() === idx;
        });

        const rev = matching.reduce((sum, b) => sum + (b.status !== 'cancelled' ? (b.finalPrice || 0) : 0), 0);
        const confirmed = matching.filter((b) => b.status === 'confirmed').length;
        const completed = matching.filter((b) => b.status === 'completed' || b.status === 'checked-in').length;
        const cancelled = matching.filter((b) => b.status === 'cancelled').length;

        return {
          label: month,
          revenue: rev,
          bookingsCount: matching.length,
          confirmed,
          completed,
          cancelled,
        };
      });
    }

    // 4. Yearly: Distinct real years recorded in Firestore
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    bookings.forEach(b => {
      const dateVal = b.date || b.createdAt;
      if (dateVal) {
        yearsSet.add(new Date(dateVal).getFullYear());
      }
    });
    const sortedYears = Array.from(yearsSet).sort();

    return sortedYears.map(yr => {
      const matching = bookings.filter(b => {
        const dateVal = b.date || b.createdAt;
        if (!dateVal) return false;
        return new Date(dateVal).getFullYear() === yr;
      });

      const rev = matching.reduce((sum, b) => sum + (b.status !== 'cancelled' ? (b.finalPrice || 0) : 0), 0);
      const confirmed = matching.filter((b) => b.status === 'confirmed').length;
      const completed = matching.filter((b) => b.status === 'completed' || b.status === 'checked-in').length;
      const cancelled = matching.filter((b) => b.status === 'cancelled').length;

      return {
        label: String(yr),
        revenue: rev,
        bookingsCount: matching.length,
        confirmed,
        completed,
        cancelled,
      };
    });
  }, [timeframe, bookings]);

  // Overall Global Realtime Stats
  const globalStats = useMemo(() => {
    const validBookings = bookings.filter(b => b.status !== 'cancelled');
    const totalRev = validBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const totalCount = bookings.length;
    const paidCount = validBookings.length;
    const aov = paidCount > 0 ? Math.round(totalRev / paidCount) : 0;
    const totalGuests = validBookings.reduce((sum, b) => sum + (b.guestsCount || 0), 0);
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const checkedInCount = bookings.filter(b => b.status === 'checked-in').length;
    const completedCount = bookings.filter(b => b.status === 'completed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

    return {
      totalRev,
      totalCount,
      paidCount,
      aov,
      totalGuests,
      confirmedCount,
      checkedInCount,
      completedCount,
      cancelledCount
    };
  }, [bookings]);

  // Current timeframe slice totals
  const totalPeriodRevenue = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.revenue, 0);
  }, [chartData]);

  const totalPeriodBookings = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.bookingsCount, 0);
  }, [chartData]);

  // Real Room Popularity & Revenue Breakdown
  const roomStats = useMemo(() => {
    const roomMap: Record<string, { id: string; name: string; revenue: number; bookingsCount: number }> = {};
    
    // Initialize with available rooms
    rooms.forEach(r => {
      roomMap[r.id] = { id: r.id, name: r.name, revenue: 0, bookingsCount: 0 };
    });

    bookings.forEach(b => {
      if (b.status !== 'cancelled') {
        const key = b.roomId || 'unknown';
        if (!roomMap[key]) {
          roomMap[key] = { id: key, name: b.roomName || 'Party Suite', revenue: 0, bookingsCount: 0 };
        }
        roomMap[key].revenue += (b.finalPrice || 0);
        roomMap[key].bookingsCount += 1;
      }
    });

    return Object.values(roomMap).sort((a, b) => b.revenue - a.revenue);
  }, [rooms, bookings]);

  // Real Add-On Usage Breakdown
  const addonStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};

    bookings.forEach(b => {
      if (b.status !== 'cancelled' && b.addOns) {
        b.addOns.forEach(addon => {
          if (!map[addon.name]) {
            map[addon.name] = { name: addon.name, count: 0, revenue: 0 };
          }
          map[addon.name].count += addon.quantity;
          map[addon.name].revenue += addon.price * addon.quantity;
        });
      }
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [bookings]);

  // Max revenue for SVG scaling
  const maxRevenue = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.revenue), 1000);
    return Math.ceil(max * 1.15);
  }, [chartData]);

  // Chart coordinates
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingX = 40;
  const paddingY = 30;
  const usableWidth = svgWidth - paddingX * 2;
  const usableHeight = svgHeight - paddingY * 2;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(1, chartData.length - 1)) * usableWidth;
    const y = svgHeight - paddingY - (d.revenue / maxRevenue) * usableHeight;
    return { x, y, ...d };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  return (
    <div id="admin-analytics-view" className="space-y-6 text-left animate-fadeIn">
      
      {/* Realtime Stream Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#202020] border border-[#383838] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-outfit">
                Real-Time Operations Analytics
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Firestore
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Computed strictly from actual Firestore database transactions with zero mock values.
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center bg-[#181818] p-1.5 rounded-2xl border border-[#383838]">
          {(['daily', 'weekly', 'monthly', 'yearly'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              id={`analytics-timeframe-${tf}-btn`}
              onClick={() => {
                setTimeframe(tf);
                setHoveredIndex(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Real Revenue */}
        <div className="p-5 rounded-3xl bg-[#202020] border border-[#383838] space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-bold uppercase tracking-wider">Live Net Revenue</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
              ₹{globalStats.totalRev.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              Period View: <strong className="text-amber-400 font-mono">₹{totalPeriodRevenue.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Total Confirmed & Paid Bookings */}
        <div className="p-5 rounded-3xl bg-[#202020] border border-[#383838] space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-bold uppercase tracking-wider">Total Bookings</span>
            <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
              {globalStats.totalCount}
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              {globalStats.confirmedCount} Confirmed • {globalStats.completedCount} Completed
            </div>
          </div>
        </div>

        {/* Real Average Booking Value */}
        <div className="p-5 rounded-3xl bg-[#202020] border border-[#383838] space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-bold uppercase tracking-wider">Average Order Value</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
              ₹{globalStats.aov.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              Across {globalStats.paidCount} paying celebrations
            </div>
          </div>
        </div>

        {/* Total Guests Hosted */}
        <div className="p-5 rounded-3xl bg-[#202020] border border-[#383838] space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="font-bold uppercase tracking-wider">Guests Entertained</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
              {globalStats.totalGuests.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              In acoustic suites & vaults
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Revenue Graph */}
      <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#383838] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-outfit">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Real Revenue Timeline ({timeframe.toUpperCase()})</span>
            </h3>
            <p className="text-xs text-gray-400">
              Visualizes real revenue received per {timeframe === 'daily' ? 'day' : timeframe === 'weekly' ? 'week' : timeframe === 'monthly' ? 'month' : 'year'}.
            </p>
          </div>

          {hoveredIndex !== null && chartData[hoveredIndex] && (
            <div className="p-2 px-3 rounded-xl bg-[#181818] border border-amber-500/30 text-xs flex items-center gap-3">
              <span className="font-bold text-white">{chartData[hoveredIndex].label}:</span>
              <span className="text-amber-400 font-black font-outfit">₹{chartData[hoveredIndex].revenue.toLocaleString('en-IN')}</span>
              <span className="text-gray-400 font-mono">({chartData[hoveredIndex].bookingsCount} bookings)</span>
            </div>
          )}
        </div>

        {/* SVG Curve Chart */}
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[640px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="realRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingY + pct * usableHeight;
                const revLabel = Math.round(maxRevenue * (1 - pct));
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#2f2f2f"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#737373"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      ₹{revLabel > 1000 ? `${(revLabel / 1000).toFixed(0)}k` : revLabel}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              {areaD && (
                <path d={areaD} fill="url(#realRevenueGradient)" />
              )}

              {/* Line path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points & Interaction */}
              {points.map((p, i) => (
                <g 
                  key={i}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === i ? 6 : 4}
                    fill={hoveredIndex === i ? '#ffffff' : '#f59e0b'}
                    stroke="#1c1c1c"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                  {/* Bottom Label */}
                  <text
                    x={p.x}
                    y={svgHeight - 8}
                    fill={hoveredIndex === i ? '#ffffff' : '#888888'}
                    fontSize="10"
                    fontWeight={hoveredIndex === i ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Rooms & Top Add-Ons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Rooms Performance */}
        <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#383838] pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-outfit">
              <Building className="w-4 h-4 text-amber-400" />
              Room Suite Performance
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              {roomStats.length} Suites Ranked
            </span>
          </div>

          <div className="space-y-3">
            {roomStats.map((room, idx) => {
              const maxRev = roomStats[0]?.revenue || 1;
              const pct = Math.min(100, Math.round((room.revenue / (maxRev || 1)) * 100));

              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#181818] border border-[#303030] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate max-w-[200px]">
                      {room.name}
                    </span>
                    <span className="font-black text-amber-400 font-outfit">
                      ₹{room.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{room.bookingsCount} Total Bookings</span>
                    <span>{pct}% of peak suite volume</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Add-Ons Performance */}
        <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#383838] pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-outfit">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Party Add-Ons & Upsells
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              {addonStats.length} Unique Packages
            </span>
          </div>

          {addonStats.length > 0 ? (
            <div className="space-y-3">
              {addonStats.map((addon, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#181818] border border-[#303030] flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">
                      {addon.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Ordered {addon.count} times
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-400 font-outfit block">
                      ₹{addon.revenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-500">Gross Sales</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#181818] rounded-2xl border border-[#303030] space-y-2">
              <Tag className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs text-gray-400 font-medium">No Add-Ons Recorded Yet</p>
              <p className="text-[11px] text-gray-500">
                When customers attach DJ sets, laser rigs, or neon wristbands to bookings, they will appear here in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
