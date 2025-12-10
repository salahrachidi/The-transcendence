import Image from "next/image";
import { redirect } from "next/navigation";

export default function Home() {
	//! to test 500 error page
	// throw new Error("Intentional test error");
	//! always redirect to login
	redirect("/login");
}
