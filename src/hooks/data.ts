import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { createCategory, updateCategory, type CategoryInput } from '../api/categories'
import { listCategories } from '../api/categories'
import { addCompletion, listCompletionsSince, removeCompletion } from '../api/completions'
import { getProfile, updateTimezone } from '../api/profile'
import { createTask, deleteTask, listTasks, updateTask, type TaskInput } from '../api/tasks'
import { addDays, completionSet, todayKey, type Completion, type DateKey, type Task } from '../core'

export const qk = {
  profile: ['profile'] as const,
  categories: ['categories'] as const,
  tasks: ['tasks'] as const,
  completions: ['completions'] as const,
}

const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

/** The user's timezone; adopts the browser's timezone the first time. */
export function useTimezone(): string {
  const qc = useQueryClient()
  const { data: profile } = useQuery({ queryKey: qk.profile, queryFn: getProfile })
  useEffect(() => {
    if (profile && profile.timezone === 'UTC' && browserTz !== 'UTC') {
      updateTimezone(profile.id, browserTz).then(() => qc.invalidateQueries({ queryKey: qk.profile }))
    }
  }, [profile, qc])
  return profile?.timezone && profile.timezone !== 'UTC' ? profile.timezone : browserTz
}

export function useToday(): DateKey {
  return todayKey(useTimezone())
}

export const useCategories = () => useQuery({ queryKey: qk.categories, queryFn: listCategories })
export const useTasks = () => useQuery({ queryKey: qk.tasks, queryFn: listTasks })

/** About 13 months of completions — enough for history and streaks. */
const HISTORY_DAYS = 400

export function useCompletions() {
  const today = todayKey(browserTz)
  const query = useQuery({
    queryKey: qk.completions,
    queryFn: () => listCompletionsSince(addDays(today, -HISTORY_DAYS)),
  })
  const done = useMemo(() => completionSet(query.data ?? []), [query.data])
  return { ...query, done }
}

export function useToggleCompletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ task, date, done }: { task: Task; date: DateKey; done: boolean }) =>
      done ? addCompletion(task.id, date).then(() => undefined) : removeCompletion(task.id, date),
    // Optimistic: flip the checkbox instantly, roll back on error.
    onMutate: async ({ task, date, done }) => {
      await qc.cancelQueries({ queryKey: qk.completions })
      const prev = qc.getQueryData<Completion[]>(qk.completions) ?? []
      const next = done
        ? [...prev, { id: `tmp-${task.id}-${date}`, user_id: task.user_id, task_id: task.id, date, completed_at: new Date().toISOString() }]
        : prev.filter((c) => !(c.task_id === task.id && c.date === date))
      qc.setQueryData(qk.completions, next)
      return { prev }
    },
    onError: (_err, _vars, ctx) => ctx && qc.setQueryData(qk.completions, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.completions }),
  })
}

export function useSaveTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: TaskInput }) => (id ? updateTask(id, input) : createTask(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateTask>[1] }) => updateTask(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tasks })
      qc.invalidateQueries({ queryKey: qk.completions })
    },
  })
}

export function useSaveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Partial<CategoryInput> }) =>
      id ? updateCategory(id, input) : createCategory(input as CategoryInput),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  })
}
