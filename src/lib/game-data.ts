// TypeScript interfaces for game data

export interface CollectibleItem {
  id: string;
  name: string;
  image: string;
  requirement: string;
  lore: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  type: string;
  generation: string;
  foundIn: string;
  relatedAchievementId?: string;
}

export interface CollectionSet {
  id: string;
  title: string;
  total: number;
  collected: string[];
  reward: string;
  items: CollectibleItem[];
}

export interface AchievementDetail {
  label: string;
  value: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: 'brush' | 'trophy' | 'zap' | 'star' | 'code';
  date?: string;
  progress?: string;
  type?: string;
  details: AchievementDetail[];
}

export const collectionSets: CollectionSet[] = [
  {
    id: "set-01",
    title: "Vacuum Pups",
    total: 4,
    collected: ["rover-x", "cyber-spaniel", "atomic-poodle"], 
    reward: "Mecha-Pup Trophy",
    items: [
        { 
            id: "rover-x", 
            name: "Rover-X", 
            image: "bg-orange-500", 
            requirement: "Code: DOG",
            lore: "The Rover-X was the first autonomous cleaning unit to feature 'Happy-Wag' tail technology. Originally designed to clean radioactive dust from lunar colonies, it became a beloved household pet when surplus units were sold to Earth families. Its sensors are calibrated to detect both dirt and sadness.",
            rarity: "Common",
            type: "Companion",
            generation: "Gen-1",
            foundIn: "Sector 7: Residential"
        },
        { 
            id: "cyber-spaniel", 
            name: "Cyber-Spaniel", 
            image: "bg-blue-500", 
            requirement: "Complete 'First Splash' achievement", 
            relatedAchievementId: "ach-01",
            lore: "Engineered for aquatic environments, the Cyber-Spaniel features hydrophobic synthetic fur and webbed chassis plating. It was briefly used by the Navy for underwater cable inspection before being discharged for 'excessive playfulness'.",
            rarity: "Uncommon",
            type: "Amphibious",
            generation: "Gen-2",
            foundIn: "Sector 3: Docks"
        },
        { 
            id: "atomic-poodle", 
            name: "Atomic-Poodle", 
            image: "bg-green-500", 
            requirement: "Submit 5 pages",
            lore: "A high-maintenance unit requiring uranium-enriched kibble. The Atomic-Poodle radiates a soft green glow and warms the feet of its owners. Known for its sophisticated AI that judges your interior design choices.",
            rarity: "Rare",
            type: "Luxury",
            generation: "Gen-2",
            foundIn: "Sector 1: High City"
        },
        { 
            id: "quantum-bulldog", 
            name: "Quantum-Bulldog", 
            image: "bg-purple-500", 
            requirement: "Code: QUANTUM",
            lore: "Existing simultaneously in the living room and the kitchen, the Quantum-Bulldog is the ultimate guard dog. It can bark at intruders before they even arrive. Caution: May occasionally phase through closed doors.",
            rarity: "Legendary",
            type: "Temporal",
            generation: "Gen-X",
            foundIn: "Sector 0: The Void"
        }, 
    ]
  },
  {
    id: "set-02",
    title: "Star Drifter",
    total: 5,
    collected: ["alpha-wing", "beta-destroyer"],
    reward: "Galactic Cruiser Model",
    items: [
        { 
            id: "alpha-wing", 
            name: "Alpha-Wing", 
            image: "bg-red-500", 
            requirement: "Reach Level 5",
            lore: "The standard issue interceptor for the Galactic Federation. Fast, agile, and equipped with non-lethal pulse cannons for disabling space debris.",
            rarity: "Common",
            type: "Interceptor",
            generation: "Mk-I",
            foundIn: "Orbital Station Alpha"
        },
        { 
            id: "beta-destroyer", 
            name: "Beta-Destroyer", 
            image: "bg-yellow-500", 
            requirement: "Color 3 Space pages",
            lore: "A heavy-duty mining vessel repurposed for asteroid defense. Its yellow hull is reinforced with diamond-nanoweave to withstand impacts.",
            rarity: "Uncommon",
            type: "Heavy",
            generation: "Mk-II",
            foundIn: "Asteroid Belt"
        },
        { 
            id: "gamma-scout", 
            name: "Gamma-Scout", 
            image: "bg-cyan-500", 
            requirement: "Find hidden link",
            lore: "A long-range reconnaissance ship capable of FTL jumps. Used by explorers to map the outer rim. It carries no weapons, only sensors and a really good coffee machine.",
            rarity: "Rare",
            type: "Scout",
            generation: "Mk-III",
            foundIn: "Deep Space"
        },
        { 
            id: "delta-cruiser", 
            name: "Delta-Cruiser", 
            image: "bg-pink-500", 
            requirement: "Share 10 pages",
            lore: "A luxury liner for the stars. The Delta-Cruiser features zero-g swimming pools and holographic concerts. The ultimate status symbol for the interstellar traveler.",
            rarity: "Epic",
            type: "Luxury",
            generation: "Mk-IV",
            foundIn: "Neon City Spaceport"
        },
        { 
            id: "omega-station", 
            name: "Omega-Station", 
            image: "bg-indigo-500", 
            requirement: "Complete Set 1",
            lore: "A mobile space fortress. It serves as a hub for trade, diplomacy, and the occasional laser tag tournament. Powered by a harnessed black hole.",
            rarity: "Legendary",
            type: "Station",
            generation: "Mk-V",
            foundIn: "Galactic Center"
        },
    ]
  }
];

export const achievements: Achievement[] = [
    {
        id: "ach-01",
        title: "First Splash",
        description: "Submitted your first colored page.",
        unlocked: true,
        icon: "brush",
        date: "2025-11-01",
        details: [{ label: "Account Created", value: "2025-10-25" }, { label: "Submission ID", value: "#SUB-8821" }, { label: "Time", value: "14:32 UTC" }]
    },
    {
        id: "ach-02",
        title: "Collection Hunter",
        description: "Completed your first collectible set.",
        unlocked: false,
        icon: "trophy",
        progress: "3/4 Items",
        details: [{ label: "Vacuum Pups", value: "3/4 Collected" }, { label: "Nearest Goal", value: "Vacuum Pups (1 left)" }]
    },
    {
        id: "ach-03",
        title: "Speed Demon",
        description: "Submitted 5 pages in a single day.",
        unlocked: false,
        icon: "zap",
        progress: "2/5 Pages",
        details: [{ label: "Current Session", value: "2 Pages" }, { label: "Best Streak", value: "3 Pages (Nov 12)" }]
    },
    {
        id: "ach-04",
        title: "Master Colorist",
        description: "Submitted 50 colored pages total.",
        unlocked: false,
        icon: "star",
        progress: "12/50 Pages",
        details: [{ label: "Total Submissions", value: "12" }, { label: "Rank", value: "Novice" }]
    },
    {
        id: "ach-05",
        title: "Early Adopter",
        description: "Joined during the beta phase.",
        unlocked: true,
        icon: "code",
        date: "2025-10-25",
        details: [{ label: "Beta Wave", value: "Wave 1" }, { label: "User ID", value: "0001-ALPHA" }]
    },
    {
        id: "ach-06",
        title: "Neon Nights",
        description: "Color 10 Cyberpunk themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "4/10 Pages",
        details: [{ label: "Theme", value: "Cyberpunk" }, { label: "Progress", value: "40%" }]
    },
    {
        id: "ach-07",
        title: "Pixel Perfect",
        description: "Use the pixel brush on 20 different regions.",
        unlocked: false,
        icon: "brush",
        progress: "15/20 Regions",
        details: [{ label: "Tool Used", value: "Pixel Brush" }]
    },
    {
        id: "ach-08",
        title: "Social Butterfly",
        description: "Share 5 colored pages to the community gallery.",
        unlocked: true,
        icon: "star",
        date: "2025-11-15",
        details: [{ label: "Shared", value: "5" }, { label: "Likes Received", value: "142" }]
    },
    {
        id: "ach-09",
        title: "Night Owl",
        description: "Submit a page between 2AM and 5AM local time.",
        unlocked: false,
        icon: "zap",
        progress: "0/1",
        details: [{ label: "Time Window", value: "02:00 - 05:00" }]
    },
    {
        id: "ach-10",
        title: "Weekend Warrior",
        description: "Submit pages on 4 consecutive weekends.",
        unlocked: false,
        icon: "trophy",
        progress: "2/4 Weekends",
        details: [{ label: "Current Streak", value: "2" }]
    },
    {
        id: "ach-11",
        title: "Palette Master",
        description: "Create 10 custom color palettes.",
        unlocked: false,
        icon: "brush",
        progress: "7/10",
        details: [{ label: "Palettes", value: "7 Created" }]
    },
    {
        id: "ach-12",
        title: "Bug Hunter",
        description: "Report a bug that gets verified.",
        unlocked: false,
        icon: "code",
        progress: "0/1",
        details: [{ label: "Reports", value: "0" }]
    },
    {
        id: "ach-13",
        title: "Monochrome Madness",
        description: "Color a page using only grayscale.",
        unlocked: false,
        icon: "brush",
        progress: "0/1",
        details: [{ label: "Mode", value: "Grayscale" }]
    },
    {
        id: "ach-14",
        title: "Rainbow Connection",
        description: "Use 7 different colors on a single page.",
        unlocked: false,
        icon: "brush",
        progress: "5/7 Colors",
        details: [{ label: "Colors Used", value: "5" }]
    },
    {
        id: "ach-15",
        title: "Cybernetic Surgeon",
        description: "Zoom in to 400% while coloring.",
        unlocked: false,
        icon: "brush",
        progress: "0/1",
        details: [{ label: "Max Zoom", value: "250%" }]
    },
    {
        id: "ach-16",
        title: "Undo Master",
        description: "Use undo 50 times on a single page.",
        unlocked: false,
        icon: "brush",
        progress: "12/50",
        details: [{ label: "Undos", value: "12" }]
    },
    {
        id: "ach-17",
        title: "Perfectionist",
        description: "Spend over 2 hours on a single page.",
        unlocked: false,
        icon: "trophy",
        progress: "45/120 Mins",
        details: [{ label: "Time Spent", value: "45m" }]
    },
    {
        id: "ach-18",
        title: "Speed Runner",
        description: "Finish a page in under 5 minutes.",
        unlocked: false,
        icon: "zap",
        progress: "0/1",
        details: [{ label: "Best Time", value: "8m 12s" }]
    },
    {
        id: "ach-19",
        title: "Daily Streak",
        description: "Log in for 7 days in a row.",
        unlocked: true,
        icon: "zap",
        date: "2025-11-20",
        details: [{ label: "Streak", value: "7 Days" }]
    },
    {
        id: "ach-20",
        title: "Monthly Streak",
        description: "Log in for 30 days in a row.",
        unlocked: false,
        icon: "trophy",
        progress: "12/30 Days",
        details: [{ label: "Current Streak", value: "12 Days" }]
    },
    {
        id: "ach-21",
        title: "Yearly Streak",
        description: "Log in for 365 days in a row.",
        unlocked: false,
        icon: "trophy",
        progress: "12/365 Days",
        details: [{ label: "Current Streak", value: "12 Days" }]
    },
    {
        id: "ach-22",
        title: "Gallery Curator",
        description: "Like 50 community pages.",
        unlocked: false,
        icon: "star",
        progress: "23/50 Likes",
        details: [{ label: "Likes Given", value: "23" }]
    },
    {
        id: "ach-23",
        title: "Trendsetter",
        description: "Have a page reach the top 10 daily popular list.",
        unlocked: false,
        icon: "star",
        progress: "0/1",
        details: [{ label: "Highest Rank", value: "#42" }]
    },
    {
        id: "ach-24",
        title: "Influencer",
        description: "Have a page reach 100 likes.",
        unlocked: false,
        icon: "star",
        progress: "14/100 Likes",
        details: [{ label: "Most Liked", value: "Neon Dog" }]
    },
    {
        id: "ach-25",
        title: "Viral",
        description: "Have a page reach 1000 likes.",
        unlocked: false,
        icon: "star",
        progress: "14/1000 Likes",
        details: [{ label: "Most Liked", value: "Neon Dog" }]
    },
    {
        id: "ach-26",
        title: "Beta Tester",
        description: "Report 5 bugs.",
        unlocked: false,
        icon: "code",
        progress: "2/5 Bugs",
        details: [{ label: "Reports", value: "2" }]
    },
    {
        id: "ach-27",
        title: "Code Cracker",
        description: "Enter 10 valid collectible codes.",
        unlocked: false,
        icon: "code",
        progress: "1/10 Codes",
        details: [{ label: "Valid Codes", value: "1" }]
    },
    {
        id: "ach-28",
        title: "Vault Hunter",
        description: "Unlock 5 collectible sets.",
        unlocked: false,
        icon: "trophy",
        progress: "0/5 Sets",
        details: [{ label: "Sets", value: "0" }]
    },
    {
        id: "ach-29",
        title: "Completionist",
        description: "Unlock all achievements.",
        unlocked: false,
        icon: "trophy",
        progress: "3/47",
        details: [{ label: "Total", value: "3/47" }]
    },
    {
        id: "ach-30",
        title: "Hidden Gem",
        description: "Find a hidden link on the website.",
        unlocked: false,
        icon: "code",
        progress: "0/1",
        details: [{ label: "Found", value: "No" }]
    },
    {
        id: "ach-31",
        title: "Konami Code",
        description: "Enter the Konami code on the dashboard.",
        unlocked: false,
        icon: "code",
        progress: "0/1",
        details: [{ label: "Status", value: "Locked" }]
    },
    {
        id: "ach-32",
        title: "Space Cadet",
        description: "Color 5 Space-themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "2/5 Pages",
        details: [{ label: "Theme", value: "Space" }]
    },
    {
        id: "ach-33",
        title: "Jungle Explorer",
        description: "Color 5 Nature-themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "0/5 Pages",
        details: [{ label: "Theme", value: "Nature" }]
    },
    {
        id: "ach-34",
        title: "Deep Dive",
        description: "Color 5 Underwater-themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "0/5 Pages",
        details: [{ label: "Theme", value: "Underwater" }]
    },
    {
        id: "ach-35",
        title: "Bot Builder",
        description: "Color 5 Robot-themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "3/5 Pages",
        details: [{ label: "Theme", value: "Robots" }]
    },
    {
        id: "ach-36",
        title: "Steampunk Tinkerer",
        description: "Color 5 Steampunk-themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "1/5 Pages",
        details: [{ label: "Theme", value: "Steampunk" }]
    },
    {
        id: "ach-37",
        title: "Fantasy Weaver",
        description: "Color 5 Fantasy-themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "0/5 Pages",
        details: [{ label: "Theme", value: "Fantasy" }]
    },
    {
        id: "ach-38",
        title: "Horror Fanatic",
        description: "Color 5 Horror-themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "0/5 Pages",
        details: [{ label: "Theme", value: "Horror" }]
    },
    {
        id: "ach-39",
        title: "Abstract Artist",
        description: "Color 5 Abstract pages.",
        unlocked: false,
        icon: "brush",
        progress: "0/5 Pages",
        details: [{ label: "Theme", value: "Abstract" }]
    },
    {
        id: "ach-40",
        title: "Portrait Artist",
        description: "Color 5 Character portraits.",
        unlocked: false,
        icon: "brush",
        progress: "1/5 Pages",
        details: [{ label: "Type", value: "Portrait" }]
    },
    {
        id: "ach-41",
        title: "Landscape Artist",
        description: "Color 5 Scenery pages.",
        unlocked: false,
        icon: "brush",
        progress: "0/5 Pages",
        details: [{ label: "Type", value: "Scenery" }]
    },
    {
        id: "ach-42",
        title: "Vehicle Enthusiast",
        description: "Color 5 Vehicle pages.",
        unlocked: false,
        icon: "brush",
        progress: "2/5 Pages",
        details: [{ label: "Type", value: "Vehicles" }]
    },
    {
        id: "ach-43",
        title: "Architect",
        description: "Color 5 Building/Structure pages.",
        unlocked: false,
        icon: "brush",
        progress: "0/5 Pages",
        details: [{ label: "Type", value: "Architecture" }]
    },
    {
        id: "ach-44",
        title: "Animal Lover",
        description: "Color 5 Animal pages.",
        unlocked: false,
        icon: "brush",
        progress: "3/5 Pages",
        details: [{ label: "Type", value: "Animals" }]
    },
    {
        id: "ach-45",
        title: "Foodie",
        description: "Color 5 Food-themed pages.",
        unlocked: false,
        icon: "brush",
        progress: "0/5 Pages",
        details: [{ label: "Type", value: "Food" }]
    },
    {
        id: "ach-46",
        title: "Holiday Spirit",
        description: "Color a Holiday-themed page.",
        unlocked: false,
        icon: "brush",
        progress: "0/1",
        details: [{ label: "Type", value: "Holiday" }]
    },
    {
        id: "ach-48",
        title: "Festive Spirit",
        description: "Color a holiday-themed page during December.",
        unlocked: false,
        icon: "star",
        progress: "0/1",
        type: "holiday",
        details: [{ label: "Month", value: "December" }]
    },
    {
        id: "ach-49",
        title: "Gift Wrapper",
        description: "Share a holiday page with a friend.",
        unlocked: false,
        icon: "star",
        progress: "0/1",
        type: "holiday",
        details: [{ label: "Shared", value: "No" }]
    },
    {
        id: "ach-50",
        title: "Cosmic Santa",
        description: "Find the hidden Santa in the 'Cosmic Xmas' book.",
        unlocked: false,
        icon: "trophy",
        progress: "0/1",
        type: "holiday",
        details: [{ label: "Found", value: "No" }]
    }
];
