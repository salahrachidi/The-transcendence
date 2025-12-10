export default function DashboardLoading() {
	return (
		<div className="animate-pulse">
			{/* ========== ROW 1: Profile • Hero • Online ========== */}
			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-auto xl:h-[clamp(420px,50vh,900px)]">
				{/* Profile Skeleton */}
				<section className="col-span-12 lg:col-span-4 min-w-0 h-auto xl:h-full min-h-[380px]">
					<div className="glass p-5 rounded-2xl h-full flex flex-col gap-4">
						<div className="h-48 bg-white/5 rounded-xl w-full" />
						<div className="flex items-center gap-4 -mt-12 px-4">
							<div className="w-24 h-24 rounded-full bg-white/10 border-4 border-[#0f172a]" />
							<div className="h-8 bg-white/10 rounded w-32 mt-8" />
						</div>
						<div className="flex-1 space-y-4 p-4">
							<div className="h-4 bg-white/5 rounded w-3/4" />
							<div className="h-4 bg-white/5 rounded w-1/2" />
							<div className="grid grid-cols-3 gap-2 mt-4">
								<div className="h-16 bg-white/5 rounded" />
								<div className="h-16 bg-white/5 rounded" />
								<div className="h-16 bg-white/5 rounded" />
							</div>
						</div>
					</div>
				</section>

				{/* Hero Skeleton */}
				<section className="col-span-12 lg:col-span-8 xl:col-span-7 min-w-0 h-auto xl:h-full min-h-[380px] xl:min-h-0">
					<div className="glass p-8 rounded-2xl h-full flex flex-col justify-center items-center gap-6">
						<div className="w-32 h-32 rounded-full bg-white/5" />
						<div className="h-10 bg-white/5 rounded w-64" />
						<div className="h-12 bg-white/10 rounded-full w-48" />
					</div>
				</section>

				{/* Online Skeleton */}
				<section className="col-span-12 xl:col-span-1 min-w-0 h-auto xl:h-full min-h-[380px] xl:min-h-0">
					<div className="glass p-4 rounded-2xl h-full flex flex-col gap-3">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="w-10 h-10 rounded-full bg-white/5 mx-auto" />
						))}
					</div>
				</section>
			</div>

			{/* ========== ROW 2: Ranking • Statistics • Matches ========== */}
			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-auto xl:h-[clamp(420px,50vh,900px)] mt-6">
				{/* Ranking Skeleton */}
				<section className="col-span-12 xl:col-span-4 min-w-0 h-auto xl:h-full min-h-[340px]">
					<div className="glass p-5 rounded-2xl h-full space-y-4">
						<div className="h-6 bg-white/5 rounded w-1/3" />
						{[...Array(5)].map((_, i) => (
							<div key={i} className="h-12 bg-white/5 rounded w-full" />
						))}
					</div>
				</section>

				{/* Statistics Skeleton */}
				<section className="col-span-12 xl:col-span-4 min-w-0 h-auto xl:h-full min-h-[420px]">
					<div className="glass p-5 rounded-2xl h-full space-y-4">
						<div className="h-6 bg-white/5 rounded w-1/3" />
						<div className="h-48 bg-white/5 rounded w-full mt-8" />
					</div>
				</section>

				{/* Matches Skeleton */}
				<section className="col-span-12 xl:col-span-4 min-w-0 h-auto xl:h-full min-h-[380px]">
					<div className="glass p-5 rounded-2xl h-full space-y-4">
						<div className="h-6 bg-white/5 rounded w-1/3" />
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-16 bg-white/5 rounded w-full" />
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
