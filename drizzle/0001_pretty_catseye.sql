CREATE TABLE "photos" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"url" text NOT NULL,
	"key" text NOT NULL,
	"uploader_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;