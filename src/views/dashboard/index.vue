<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReservationStore } from '../../stores/reservation'
import { getVehicleList } from '../../api/vehicle'
import type { Vehicle } from '../../types/vehicle'
import type { VehicleScheduleItem } from '../../types/reservation'
import * as echarts from 'echarts'
import ReservationForm from './components/ReservationForm.vue'
import ReservationDetail from './components/ReservationDetail.vue'

const { t } = useI18n()
const reservationStore = useReservationStore()

const chartRef = ref<HTMLDivElement>()
const loading = ref(false)
const showForm = ref(false)
const showDetail = ref(false)
const detailId = ref<string | null>(null)
const hasData = ref(false)
const unreservedVehicles = ref<Vehicle[]>([])
const quickReserveVehicle = ref<Vehicle | null>(null)

let chart: echarts.ECharts | null = null

const statusColorMap: Record<number, string> = {
  0: '#f5a623',
  1: '#5b9bd5',
}

const statusGradientMap: Record<number, [string, string]> = {
  0: ['#fcd34d', '#f59e0b'],
  1: ['#93c5fd', '#3b82f6'],
}

const statusLabelMap: Record<number, string> = {}

function getStatusLabel(status: number) {
  return statusLabelMap[status] ?? '-'
}

async function loadData() {
  loading.value = true
  try {
    statusLabelMap[0] = t('reservation.statusMap.0')
    statusLabelMap[1] = t('reservation.statusMap.1')

    const vehicleRes = await getVehicleList({ page: 1, size: 100, plateNumber: '', brand: '', model: '', color: '', status: null })
    const allVehicles = vehicleRes.data.records

    const now = new Date()
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const reservations = await reservationStore.fetchGanttData(from, to)

    hasData.value = reservations.length > 0

    const vehicleMap = new Map<string, Vehicle>()
    allVehicles.forEach((v) => vehicleMap.set(v.id!, v))

    const reservedVehicleIds = new Set(reservations.map((r) => r.vehicleId))
    const reservedVehicles = allVehicles.filter((v) => reservedVehicleIds.has(v.id!))
    unreservedVehicles.value = allVehicles.filter((v) => !reservedVehicleIds.has(v.id!))

    renderChart(reservedVehicles, reservations, vehicleMap)
  } finally {
    loading.value = false
  }
}

function renderChart(vehicles: Vehicle[], reservations: VehicleScheduleItem[], _vehicleMap: Map<string, Vehicle>) {
  if (!chartRef.value) return

  if (chart) {
    chart.dispose()
  }
  chart = echarts.init(chartRef.value)

  const vehicleNames = vehicles.map((v) => v.plateNumber || `车辆${v.id}`)
  const vehicleIds = vehicles.map((v) => v.id!)

  const now = new Date()
  let minTime = now.getTime() - 2 * 24 * 60 * 60 * 1000
  let maxTime = now.getTime() + 14 * 24 * 60 * 60 * 1000

  const seriesData: Array<{
    name: string
    value: [number, number, number, number, string, string, string]
  }> = []

  reservations.forEach((r) => {
    const vehicleIndex = vehicleIds.indexOf(r.vehicleId)
    if (vehicleIndex === -1) return

    const start = new Date(r.startTime).getTime()
    const end = new Date(r.endTime).getTime()

    if (start < minTime) minTime = start
    if (end > maxTime) maxTime = end

    seriesData.push({
      name: r.purpose,
      value: [vehicleIndex, start, end, r.status, r.purpose, r.userName, r.id],
    })
  })

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: [16, 20],
      textStyle: {
        color: '#374151',
        fontSize: 13,
        lineHeight: 22,
      },
      extraCssText: 'box-shadow: 0 10px 40px rgba(0,0,0,0.12); border-radius: 12px; max-width: 320px;',
      formatter(params: any) {
        const p = params as { value?: [number, number, number, number, string, string, number] }
        if (!p.value) return ''
        const start = new Date(p.value[1])
        const end = new Date(p.value[2])
        const status = getStatusLabel(p.value[3])
        const purpose = p.value[4]
        const userName = p.value[5]
        const color = statusColorMap[p.value[3]] || '#999'
        const formatDate = (d: Date) => {
          const month = d.getMonth() + 1
          const day = d.getDate()
          const hours = String(d.getHours()).padStart(2, '0')
          const minutes = String(d.getMinutes()).padStart(2, '0')
          const seconds = String(d.getSeconds()).padStart(2, '0')
          return `${month}月${day}日 ${hours}:${minutes}:${seconds}`
        }
        const durationMs = end.getTime() - start.getTime()
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24))
        return `
          <div style="min-width: 240px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px 12px; background: #f9fafb; border-radius: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 3px; background: ${color};"></span>
              <span style="color: #4b5563; font-weight: 500;">${status}</span>
            </div>
            <div style="color: #6b7280; font-size: 13px; line-height: 2;">
              <div style="display: flex; justify-content: space-between;">
                <span>${t('reservation.applicant')}</span>
                <span style="color: #374151; font-weight: 500;">${userName || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>${t('reservation.purpose')}</span>
                <span style="color: #374151; font-weight: 500;">${purpose || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>${t('reservation.startTime')}</span>
                <span style="color: #374151; font-weight: 500;">${formatDate(start)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>${t('reservation.endTime')}</span>
                <span style="color: #374151; font-weight: 500;">${formatDate(end)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <span>${t('reservation.duration')}</span>
                <span style="color: #111827; font-weight: 600;">${durationDays} 天</span>
              </div>
            </div>
          </div>
        `
      },
    },
    legend: {
      show: false,
    },
    grid: {
      left: 140,
      right: 60,
      top: 20,
      bottom: 60,
      containLabel: false,
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        start: 0,
        end: 100,
        zoomLock: false,
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: 10,
        height: 24,
        borderColor: '#e5e7eb',
        fillerColor: 'rgba(59, 130, 246, 0.08)',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#3b82f6',
        },
        textStyle: {
          color: '#6b7280',
          fontSize: 11,
        },
        dataBackground: {
          lineStyle: { color: '#d1d5db' },
          areaStyle: { color: '#f3f4f6' },
        },
      },
    ],
    xAxis: {
      type: 'time',
      min: minTime,
      max: maxTime,
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f3f4f6',
          type: 'solid',
        },
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        formatter(val: number) {
          const d = new Date(val)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          const hours = String(d.getHours()).padStart(2, '0')
          const minutes = String(d.getMinutes()).padStart(2, '0')
          const seconds = String(d.getSeconds()).padStart(2, '0')
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        },
      },
    },
    yAxis: {
      type: 'category',
      data: vehicleNames,
      inverse: true,
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f9fafb',
        },
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#374151',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        width: 120,
        overflow: 'truncate',
        margin: 16,
      },
    },
    series: [
      {
        type: 'custom',
        renderItem(params, api) {
          const vehicleIndex = api.value(0)
          const startTime = api.value(1)
          const endTime = api.value(2)
          const status = api.value(3)

          const start = api.coord([startTime, vehicleIndex])
          const end = api.coord([endTime, vehicleIndex])
          const size = api.size?.([0, 1]) ?? [0, 0]
          const barHeight = Math.min((Array.isArray(size) ? size[1] : 0) * 0.5, 28)
          const barHeightFinal = Math.max(barHeight, 18)

          const coordSys = params.coordSys as unknown as { x: number; y: number; width: number; height: number }
          const rect = echarts.graphic.clipRectByRect(
            {
              x: start[0],
              y: start[1] - barHeightFinal / 2,
              width: Math.max(end[0] - start[0], 6),
              height: barHeightFinal,
            },
            {
              x: coordSys.x,
              y: coordSys.y,
              width: coordSys.width,
              height: coordSys.height,
            },
          )

          if (!rect) return

          const statusValue = Number(status ?? 0)
          const gradientColors = statusGradientMap[statusValue] || ['#d1d5db', '#9ca3af']

          return {
            type: 'rect',
            transition: ['shape'],
            shape: {
              ...rect,
              r: [6, 6, 6, 6],
            },
            style: {
              fill: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: gradientColors[0] },
                { offset: 1, color: gradientColors[1] },
              ]),
              shadowBlur: 4,
              shadowColor: 'rgba(0,0,0,0.08)',
              shadowOffsetY: 1,
            },
            emphasis: {
              style: {
                shadowBlur: 8,
                shadowColor: 'rgba(0,0,0,0.15)',
              },
            },
          }
        },
        dimensions: ['vehicleIndex', 'startTime', 'endTime', 'status', 'purpose', 'userName', 'reservationId'],
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: seriesData,
        animationDuration: 600,
        animationEasing: 'cubicOut',
      },
      {
        type: 'custom',
        renderItem(params, api) {
          const x = api.coord([now.getTime(), 0])[0]
          const coordSys = params.coordSys as unknown as { y: number; height: number }
          const start = coordSys.y
          const end = coordSys.y + coordSys.height

          return {
            type: 'group',
            children: [
              {
                type: 'line',
                shape: {
                  x1: x,
                  y1: start,
                  x2: x,
                  y2: end,
                },
                style: {
                  stroke: '#ef4444',
                  lineWidth: 2,
                  lineDash: [0],
                  opacity: 0.6,
                },
              },
              {
                type: 'circle',
                shape: {
                  cx: x,
                  cy: start,
                  r: 4,
                },
                style: {
                  fill: '#ef4444',
                  opacity: 0.6,
                },
              },
            ],
          }
        },
        data: [{ value: [0] }],
        silent: true,
        z: 10,
      },
    ],
  }

  chart.setOption(option)

  chart.on('click', (params: echarts.ECElementEvent) => {
    const value = params.value as [number, number, number, number, string, string, string] | undefined
    if (value && value[6]) {
      detailId.value = value[6]
      showDetail.value = true
    }
  })
}

function handleResize() {
  chart?.resize()
}

function handleFormSuccess() {
  showForm.value = false
  quickReserveVehicle.value = null
  loadData()
}

function quickReserve(vehicle: Vehicle) {
  quickReserveVehicle.value = vehicle
  showForm.value = true
}

function handleFormClose(val: boolean) {
  if (!val) {
    quickReserveVehicle.value = null
  }
}

onMounted(async () => {
  await nextTick()
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<template>
  <div class="dashboard-container" v-loading="loading">
    <div class="dashboard-header">
      <div class="header-left">
        <h2>{{ t('dashboard.title') }}</h2>
      </div>
      <div class="header-right">
        <div class="legend-items">
          <span class="legend-item">
            <span class="legend-dot" style="background: linear-gradient(135deg, #fcd34d, #f59e0b);"></span>
            {{ t('reservation.statusMap.0') }}
          </span>
          <span class="legend-item">
            <span class="legend-dot" style="background: linear-gradient(135deg, #93c5fd, #3b82f6);"></span>
            {{ t('reservation.statusMap.1') }}
          </span>
          <span class="legend-item">
            <span class="legend-line"></span>
            <span>今天</span>
          </span>
        </div>
        <el-button type="primary" @click="showForm = true">
          {{ t('reservation.add') }}
        </el-button>
      </div>
    </div>

    <div class="chart-section">
      <div class="chart-wrapper">
        <div v-if="!hasData && !loading" class="empty-state">
          <el-empty :description="t('dashboard.noData')" />
        </div>
        <div v-else ref="chartRef" class="gantt-chart" />
      </div>
      <div class="unreserved-section">
        <div class="section-header">
          <h3>{{ t('dashboard.unreservedVehicles') }}</h3>
          <el-badge :value="unreservedVehicles.length" type="info" />
        </div>
        <div v-if="unreservedVehicles.length === 0 && !loading" class="all-reserved">
          <el-empty :description="t('dashboard.allReserved')" />
        </div>
        <div v-else class="vehicle-grid">
          <div v-for="vehicle in unreservedVehicles" :key="vehicle.id" class="vehicle-card">
            <div class="card-header">
              <span class="plate-number">{{ vehicle.plateNumber }}</span>
              <el-tag :type="vehicle.status === 1 ? 'success' : 'warning'" size="small">
                {{ vehicle.status === 1 ? t('dashboard.idle') : t('dashboard.maintenance') }}
              </el-tag>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="color-dot" :style="{ background: vehicle.color }"></span>
                <span class="vehicle-info">{{ vehicle.brand }} {{ vehicle.model }}</span>
              </div>
              <div class="info-row">
                <span class="color-text">{{ vehicle.color }}</span>
              </div>
            </div>
            <div class="card-footer" v-if="vehicle.status === 1">
              <el-button type="primary" size="small" plain @click="quickReserve(vehicle)">
                {{ t('dashboard.reserveNow') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ReservationForm v-model:visible="showForm" :initial-vehicle-id="quickReserveVehicle?.id ?? null" @success="handleFormSuccess" @update:visible="handleFormClose" />
    <ReservationDetail v-model:visible="showDetail" :reservation-id="detailId" />
  </div>
</template>

<style scoped>
.dashboard-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.header-left h2 {
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.3px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 28px;
}
.legend-items {
  display: flex;
  align-items: center;
  gap: 20px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}
.legend-line {
  width: 16px;
  height: 0;
  border-top: 2px solid #ef4444;
  opacity: 0.6;
}
.chart-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}
.chart-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
  position: relative;
  border: 1px solid #f3f4f6;
  min-height: 0;
}
.unreserved-section {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
  border: 1px solid #f3f4f6;
  min-height: 0;
  overflow-y: auto;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #111827;
  font-weight: 600;
}
.all-reserved {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}
.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.vehicle-card {
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.vehicle-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.plate-number {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}
.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}
.color-text {
  font-size: 12px;
  color: #9ca3af;
}
.vehicle-info {
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-footer {
  padding-top: 4px;
}
.gantt-chart {
  width: 100%;
  height: 100%;
}
.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
