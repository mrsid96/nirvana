import { Field, Input, Select, Textarea } from '@/components/ui'
import type { GoalPriority } from '@/types/goal'

export function GoalFormFields({
  name,
  setName,
  description,
  setDescription,
  target,
  setTarget,
  targetDate,
  setTargetDate,
  priority,
  setPriority,
}: {
  name: string
  setName: (value: string) => void
  description?: string
  setDescription?: (value: string) => void
  target: string
  setTarget: (value: string) => void
  targetDate: string
  setTargetDate: (value: string) => void
  priority: GoalPriority
  setPriority: (value: GoalPriority) => void
}) {
  return (
    <>
      <Field label="Name">
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
      </Field>
      {setDescription ? (
        <Field label="Description" hint="Optional">
          <Textarea
            value={description ?? ''}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="What is this goal for?"
          />
        </Field>
      ) : null}
      <Field label="Target amount">
        <Input
          inputMode="decimal"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          required
        />
      </Field>
      <Field label="Target date">
        <Input
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          required
        />
      </Field>
      <Field label="Priority">
        <Select
          value={priority}
          onChange={(event) => setPriority(event.target.value as GoalPriority)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </Field>
    </>
  )
}
