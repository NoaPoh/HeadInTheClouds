import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  bookTitle!: string;

  @Column({ type: 'text', nullable: true })
  content: string | null = null;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'text' })
  imageUrl!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  likes: string[] = [];

  @Column('int', { default: 0, nullable: true })
  readingProgress: number | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  authorName: string | null = null;

  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];
}

export interface IPostForFeed {
  id: string;
  userId: string;
  imageUrl: string;
  bookTitle: string;
  content: string;
  likesCount: number;
  commentsCount: number;
}

export interface INewPost {
  bookTitle: string;
  content: string;
  imageUrl: string;
  userId: string;
}
