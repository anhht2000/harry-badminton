export function assertOwner(board: { ownerId: string } | undefined, userId: string): asserts board {
  if (!board) throw new Error("Không tìm thấy board");
  if (board.ownerId !== userId) throw new Error("Không có quyền");
}
