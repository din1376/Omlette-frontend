import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { GithubIcon } from "lucide-react"
import Link from "next/link"

  
function Dropdown() {
  return (
    <DropdownMenu>
        <DropdownMenuTrigger><GithubIcon /></DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem>
                <Link href="https://github.com/din1376/Omlette-frontend">Frontend</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
                <Link href="https://github.com/din1376/omlette-backend">Backend</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
                <Link href="https://github.com/din1376/anon-aadhar-contracts">Contract</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
                <Link href="https://github.com/din1376/omlettee-subgraph">SubgGraph</Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>

  )
}

export default Dropdown