<script lang="ts">
  import exerciseSource from './lib/exercise.md?raw'
  import { parseExercise } from './lib/parseExercise'

  type ViewState =
    | { mode: 'overview' }
    | { mode: 'week'; week: number; session?: number }
    | { mode: 'exercise'; week: number; session: number; exercise: number }

  const parsed = parseExercise(exerciseSource)
  const weeks = parsed.weeks
  const errors = parsed.errors
  const maxSessions = weeks.reduce((max, week) => Math.max(max, week.sessions.length), 0)

  const DOUBLE_TAP_MS = 350
  let lastTap = { id: '', time: 0 }
  let view: ViewState = { mode: 'overview' }
  let isFocusMode = false

  function registerTap(id: string) {
    const now = Date.now()
    const isDouble = id === lastTap.id && now - lastTap.time < DOUBLE_TAP_MS
    lastTap = { id, time: now }
    return isDouble
  }

  function focusWeek(weekIndex: number) {
    if (registerTap(`week-${weekIndex}`)) {
      view = { mode: 'week', week: weekIndex }
    }
  }

  function focusSession(weekIndex: number, sessionIndex: number) {
    if (registerTap(`session-${weekIndex}-${sessionIndex}`)) {
      view = { mode: 'week', week: weekIndex, session: sessionIndex }
    }
  }

  function focusExercise(weekIndex: number, sessionIndex: number, exerciseIndex: number) {
    if (registerTap(`exercise-${weekIndex}-${sessionIndex}-${exerciseIndex}`)) {
      view = { mode: 'exercise', week: weekIndex, session: sessionIndex, exercise: exerciseIndex }
    }
  }

  const googleImageUrl = (name: string) =>
    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name)}`

  const youtubeUrl = (name: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`

  function goBack() {
    if (view.mode === 'exercise') {
      view = { mode: 'week', week: view.week, session: view.session }
      return
    }

    view = { mode: 'overview' }
  }

  $: isFocusMode = view.mode !== 'overview'

  $: activeWeekIndex = view.mode === 'week' || view.mode === 'exercise' ? view.week : undefined
  $: activeSessionIndex =
    view.mode === 'exercise'
      ? view.session
      : view.mode === 'week' && view.session !== undefined
        ? view.session
        : undefined
  $: activeExerciseIndex = view.mode === 'exercise' ? view.exercise : undefined

  $: highlightedWeekIndex = view.mode === 'week' ? activeWeekIndex : undefined

  $: activeWeek = activeWeekIndex !== undefined ? weeks[activeWeekIndex] : undefined
  $: activeSession =
    activeWeek && activeSessionIndex !== undefined ? activeWeek.sessions[activeSessionIndex] : undefined
  $: activeExercise =
    activeSession && activeExerciseIndex !== undefined
      ? activeSession.exercises[activeExerciseIndex]
      : undefined
  $: weekSessions =
    activeWeek && view.mode === 'week'
      ? view.session !== undefined
        ? [{ session: activeWeek.sessions[view.session], index: view.session }]
        : activeWeek.sessions.map((session, index) => ({ session, index }))
      : []

  $: activeWeekSessionCount = weekSessions.length
</script>

<svelte:head>
  <title>Vork Wap</title>
</svelte:head>

<main class={`mode-${view.mode}`}>
  {#if errors.length}
    <section class="notice">
      <h2>Could not parse all exercises</h2>
      <ul>
        {#each errors as message}
          <li>{message}</li>
        {/each}
      </ul>
    </section>
  {/if}

  <header class="page-header">
    <div>
      <p class="eyebrow">Vork Wap</p>
      <h1>Weekly exercise plan</h1>
      <p class="lede">Double-tap a week to zoom in, double-tap an exercise to drill down.</p>
    </div>

    {#if isFocusMode}
      <button class="back" type="button" on:click={goBack}>Back</button>
    {/if}
  </header>

  {#if view.mode === 'overview'}
    <section class="table" aria-label="Exercise overview">
      <div
        class="table-head"
        style={`grid-template-columns: 1fr repeat(${maxSessions}, 1.2fr);`}
      >
        <div>Week</div>
        {#each Array(maxSessions) as _, idx}
          <div>Session {idx + 1}</div>
        {/each}
      </div>

      {#each weeks as week, weekIndex}
        <div
          class="table-row"
          class:highlighted={highlightedWeekIndex === weekIndex}
          style={`grid-template-columns: 1fr repeat(${maxSessions}, 1.2fr);`}
        >
          <button
            class="cell week-cell button-reset"
            type="button"
            aria-label={`Open ${week.name}`}
            on:click={() => focusWeek(weekIndex)}
            on:dblclick={() => (view = { mode: 'week', week: weekIndex })}
          >
            <div class="week-chip">{week.name}</div>
            <p class="hint">Double-tap to focus</p>
          </button>

          {#each Array(maxSessions) as _, sessionCol}
            {#if week.sessions[sessionCol]}
              {#key `${weekIndex}-${sessionCol}`}
                {@const session = week.sessions[sessionCol]}
                <article class="cell session-card">
                  <header>
                    <span class="session-name">{session.name}</span>
                    <span class="topic">{session.topic || 'No topic'}</span>
                  </header>

                    <ul class="exercise-list">
                      {#each session.exercises as exercise, exerciseIndex}
                        <li>
                          <div class="exercise-chip">
                            <button
                              class="exercise-main button-reset"
                              type="button"
                              on:click={() => focusExercise(weekIndex, sessionCol, exerciseIndex)}
                              on:dblclick={() =>
                                (view = {
                                  mode: 'exercise',
                                  week: weekIndex,
                                  session: sessionCol,
                                  exercise: exerciseIndex,
                                })}
                            >
                              <span class="name">{exercise.name}</span>
                              <span class="meta">{exercise.reps}</span>
                              <span class="meta">{exercise.weight}</span>
                            </button>
                          <div class="exercise-actions">
                            <a
                              class="pill-btn"
                              href={googleImageUrl(exercise.name)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Images
                            </a>
                            <a
                              class="pill-btn ghost"
                              href={youtubeUrl(exercise.name)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              YouTube
                            </a>
                          </div>
                        </div>
                      </li>
                    {/each}
                  </ul>
                </article>
              {/key}
            {:else}
              <div class="cell empty"></div>
            {/if}
          {/each}
        </div>
      {/each}
    </section>
  {/if}

  {#if view.mode === 'week' && activeWeek}
    <section class="focus-week" aria-label={`Weekly focus: ${activeWeek.name}`}>
      <div class="focus-header">
        <p class="eyebrow">Weekly focus</p>
        <h2>{activeWeek.name}</h2>
      </div>

      <div
        class="sessions-row"
        style={`grid-template-columns: repeat(${activeWeekSessionCount || 1}, minmax(220px, 1fr));`}
      >
        {#each weekSessions as item}
          <div
            class="session-card focus session-tap"
            role="button"
            tabindex="0"
            aria-label={`Focus ${item.session.name}`}
            on:click={() => focusSession(activeWeekIndex ?? 0, item.index)}
            on:keydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                focusSession(activeWeekIndex ?? 0, item.index)
              }
            }}
            on:dblclick={() => (view = { mode: 'week', week: activeWeekIndex ?? 0, session: item.index })}
          >
            <header>
              <span class="session-name">{item.session.name}</span>
              <span class="topic">{item.session.topic || 'No topic'}</span>
            </header>

            <ul class="exercise-list">
              {#each item.session.exercises as exercise, exerciseIndex}
                <li>
                  <div class="exercise-row">
                    <button
                      class="exercise-main button-reset"
                      type="button"
                      on:click={() => focusExercise(activeWeekIndex ?? 0, item.index, exerciseIndex)}
                      on:dblclick={() =>
                        (view = {
                          mode: 'exercise',
                          week: activeWeekIndex ?? 0,
                          session: item.index,
                          exercise: exerciseIndex,
                        })}
                    >
                      <div class="name">{exercise.name}</div>
                      <div class="meta">{exercise.reps}</div>
                      <div class="meta">{exercise.weight}</div>
                    </button>
                    <div class="exercise-actions">
                      <a
                        class="pill-btn"
                        href={googleImageUrl(exercise.name)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Images
                      </a>
                      <a
                        class="pill-btn ghost"
                        href={youtubeUrl(exercise.name)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        YouTube
                      </a>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if view.mode === 'exercise' && activeExercise && activeSession && activeWeek}
    <section class="focus-exercise" aria-label={`Exercise focus: ${activeExercise.name}`}>
      <p class="eyebrow">Exercise focus</p>
      <h2>{activeExercise.name}</h2>
      <p class="meta-line">{activeExercise.reps} · {activeExercise.weight}</p>

      <div class="context">
        <span class="pill">{activeWeek.name}</span>
        <span class="pill">{activeSession.name}</span>
        <span class="pill accent">{activeSession.topic || 'No topic'}</span>
      </div>

      <div class="exercise-actions focus">
        <a class="pill-btn" href={googleImageUrl(activeExercise.name)} target="_blank" rel="noreferrer">Images</a>
        <a class="pill-btn ghost" href={youtubeUrl(activeExercise.name)} target="_blank" rel="noreferrer">YouTube</a>
      </div>

      <p class="hint">Double-tap another exercise to change focus, or use Back to exit.</p>
    </section>
  {/if}
</main>
