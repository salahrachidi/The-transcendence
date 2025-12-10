// app/(shell)/dashboard/page.tsx
import type { Metadata } from "next";
import ProfilePanel from "./ProfilePanel";
import HeroPanel from "./HeroPanel";
import OnlinePanel from "./OnlinePanel";
import RankingPanel from "./RankingPanel";
import StatisticsPanel from "./StatisticsPanel";
import MatchesPanel from "./MatchesPanel";
export const metadata: Metadata = {
	title: "Dashboard",
};

export default function DashboardPage() {
	return (
		<>
			{/* ========== ROW 1: Profile • Hero • Online ========== */}
			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-auto xl:h-[clamp(420px,50vh,900px)]">
				{/* Profile */}
				<section className="col-span-12 lg:col-span-4 min-w-0 h-auto xl:h-full min-h-[380px]">
					<ProfilePanel />
				</section>

				{/* Hero */}
				<section className="col-span-12 lg:col-span-8 xl:col-span-7 min-w-0 h-auto xl:h-full min-h-[380px] xl:min-h-0">
					<HeroPanel />
				</section>

				{/* Right rail (ROW 1): Online */}
				<section className="col-span-12 xl:col-span-1 min-w-0 h-auto xl:h-full min-h-[380px] xl:min-h-0">
					<OnlinePanel />
				</section>
			</div>
		
			{/* ========== ROW 2: Ranking • Statistics • Matches ========== */}
			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-auto xl:h-[clamp(420px,50vh,900px)] mt-6 grid-flow-row-dense xl:auto-rows-fr">
				{/* Ranking */}
				<section className="col-span-12 xl:col-span-4 min-w-0 h-auto xl:h-full min-h-[340px] xl:min-h-0 2xl:text-[1.1rem] min-[1920px]:text-[1.2rem] min-[2560px]:text-[1.3rem]">
					<RankingPanel />
				</section>

				{/* Statistics */}
				<section className="col-span-12 xl:col-span-4 min-w-0 h-auto xl:h-full min-h-[420px] xl:min-h-0">
					<StatisticsPanel />
				</section>

				{/* Right rail (ROW 2): Matches history */}
				<section className="col-span-12 xl:col-span-4 min-w-0 h-auto xl:h-full min-h-[380px] 2xl:text-[1.1rem] min-[1920px]:text-[1.2rem] min-[2560px]:text-[1.3rem]">
					<MatchesPanel />
				</section>
			</div>
		</>
	);
}
