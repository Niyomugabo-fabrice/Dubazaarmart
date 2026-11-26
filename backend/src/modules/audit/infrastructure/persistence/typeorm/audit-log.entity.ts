import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'audit_logs' })
@Index('audit_logs_created_at_idx', ['createdAt'])
@Index('audit_logs_actor_user_id_idx', ['actorUserId'])
@Index('audit_logs_record_number_idx', ['recordNumber'])
@Index('audit_logs_action_idx', ['action'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null

  @Column({ name: 'actor_name', type: 'text', nullable: true })
  actorName!: string | null

  @Column({ type: 'text' })
  action!: string

  @Column({ name: 'target_resource', type: 'text' })
  targetResource!: string

  @Column({ name: 'target_id', type: 'text', nullable: true })
  targetId!: string | null

  @Column({ name: 'record_number', type: 'text', nullable: true })
  recordNumber!: string | null

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues!: Record<string, unknown> | null

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues!: Record<string, unknown> | null

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date
}
