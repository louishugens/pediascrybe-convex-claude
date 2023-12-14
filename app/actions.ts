'use server'
import { revalidatePath } from "next/cache"

export async function refresh(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path)
  }
}