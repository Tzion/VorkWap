export type Exercise = {
  name: string
  reps: string
  weight: string
}

export type Session = {
  name: string
  topic: string
  exercises: Exercise[]
}

export type Week = {
  name: string
  sessions: Session[]
}

export type ParseResult = {
  weeks: Week[]
  errors: string[]
}

const weekHeader = /^##\s+(.+)/
const sessionHeader = /^###\s+(.+)/
const topicLine = /^topic:\s*(.+)$/i
const bulletLine = /^-\s+(.+)/

export function parseExercise(markdown: string): ParseResult {
  const weeks: Week[] = []
  const errors: string[] = []

  let currentWeek: Week | null = null
  let currentSession: Session | null = null

  const lines = markdown.split(/\r?\n/)

  lines.forEach((raw, index) => {
    const line = raw.trim()

    if (!line) return

    const weekMatch = line.match(weekHeader)
    if (weekMatch) {
      currentWeek = { name: weekMatch[1].trim(), sessions: [] }
      weeks.push(currentWeek)
      currentSession = null
      return
    }

    const sessionMatch = line.match(sessionHeader)
    if (sessionMatch) {
      if (!currentWeek) {
        errors.push(`Line ${index + 1}: session declared before a week`)
        return
      }

      currentSession = {
        name: sessionMatch[1].trim(),
        topic: '',
        exercises: [],
      }

      currentWeek.sessions.push(currentSession)
      return
    }

    const topicMatch = line.match(topicLine)
    if (topicMatch) {
      if (!currentSession) {
        errors.push(`Line ${index + 1}: topic declared before a session`)
        return
      }

      currentSession.topic = topicMatch[1].trim()
      return
    }

    const bulletMatch = line.match(bulletLine)
    if (bulletMatch) {
      if (!currentSession) {
        errors.push(`Line ${index + 1}: exercise listed before a session`)
        return
      }

      const parts = bulletMatch[1]
        .split('|')
        .map((part) => part.trim())

      if (parts.length !== 3) {
        errors.push(`Line ${index + 1}: exercise entry must be "Name | Reps | Weight"`)
        return
      }

      const [name, reps, weight = ''] = parts

      if (!name || !reps) {
        errors.push(`Line ${index + 1}: exercise entry must include name and reps`)
        return
      }

      currentSession.exercises.push({ name, reps, weight })
      return
    }

    errors.push(`Line ${index + 1}: Unrecognized content "${line}"`)
  })

  weeks.forEach((week) => {
    week.sessions.forEach((session) => {
      if (!session.topic) {
        errors.push(`${week.name} / ${session.name}: missing topic`)
      }

      if (session.exercises.length === 0) {
        errors.push(`${week.name} / ${session.name}: no exercises listed`)
      }
    })
  })

  return { weeks, errors }
}
