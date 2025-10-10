// src/helpers/date.js

// Converte Date -> 'YYYY-MM-DD'
export function fmtYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Retorna o primeiro dia (domingo ou segunda) da semana que contém 'd'
export function startOfWeek(d, weekStartsOn = 1 /* 1 = segunda; 0 = domingo */) {
  const out = new Date(d)
  const day = out.getDay()
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  out.setDate(out.getDate() - diff)
  out.setHours(0, 0, 0, 0)
  return out
}

// Array com 7 dias (Date) a partir do começo da semana
export function weekDays(fromDate) {
  const arr = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(fromDate)
    d.setDate(fromDate.getDate() + i)
    arr.push(d)
  }
  return arr
}

// Rótulo curto tipo 'seg 26'
export function labelShort(d) {
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  return `${dias[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}`
}

// Rótulo cabeçalho, tipo '26 ago 2025'
export function labelLong(d) {
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`
}
