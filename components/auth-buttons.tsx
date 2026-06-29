import { signIn, signOut, auth } from "@/lib/auth";

export async function AuthButtons() {
  const session = await auth();
  if (!session?.user) {
    return (
      <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
        <button className="rounded-md bg-accent px-4 py-2 text-on-accent">Đăng nhập với Google</button>
      </form>
    );
  }
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <span className="mr-3 text-muted">{session.user.name}</span>
      <button className="rounded-md border border-line px-3 py-1.5">Đăng xuất</button>
    </form>
  );
}
