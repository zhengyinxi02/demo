import { requireAppUser } from "../../../lib/auth";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  return Response.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    cloud: true,
    sampleData: true,
  });
}
