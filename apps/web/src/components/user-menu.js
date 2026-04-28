import { Avatar, AvatarFallback, AvatarImage, } from "@rafa-resumos/ui/components/avatar";
import { Button } from "@rafa-resumos/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@rafa-resumos/ui/components/dropdown-menu";
import { Skeleton } from "@rafa-resumos/ui/components/skeleton";
import { User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export default function UserMenu() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    if (isPending) {
        return <Skeleton className="size-8 rounded-full"/>;
    }
    if (!session) {
        return (<Link href="/login">
        <Button>Entrar</Button>
      </Link>);
    }
    const userImage = session.user.image ?? undefined;
    return (<DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer hover:opacity-80 transition-opacity">
        <Avatar>
          {userImage ? (<AvatarImage src={userImage} alt={session.user.name ?? ""}/>) : null}
          <AvatarFallback>
            <User className="size-4" strokeWidth={1.75}/>
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-[#9b9a97]">
            {session.user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#ededec]"/>
          <DropdownMenuItem variant="destructive" onClick={() => {
            authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/");
                    },
                },
            });
        }}>
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>);
}
