import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";
export const metadata: Metadata = { title: "Sign up" };

export default function Page() { 
	return <RegisterClient />; 
}


