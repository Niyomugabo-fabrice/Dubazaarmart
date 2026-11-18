import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'audit_logs' })
@Index('audit_logs_created_at_idx', ['createdAt'])
@Index('audit_logs_actor_user_id_idx', ['actorUserId'])
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

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, string | number | boolean | null>

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date
}
