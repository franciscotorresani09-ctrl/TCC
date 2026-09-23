import { PrismaClient, type BodyType, type Drivetrain, type EventType, type FuelType, type Transmission, type VehicleCondition } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const u = (id: string, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const CITIES: Record<string, { state: string; lat: number; lng: number; zip: string }> = {
  Miami: { state: "FL", lat: 25.7617, lng: -80.1918, zip: "33101" },
  Orlando: { state: "FL", lat: 28.5383, lng: -81.3792, zip: "32801" },
  "Los Angeles": { state: "CA", lat: 34.0522, lng: -118.2437, zip: "90012" },
  "San Francisco": { state: "CA", lat: 37.7749, lng: -122.4194, zip: "94103" },
  "New York": { state: "NY", lat: 40.7128, lng: -74.006, zip: "10001" },
  Austin: { state: "TX", lat: 30.2672, lng: -97.7431, zip: "73301" },
  Dallas: { state: "TX", lat: 32.7767, lng: -96.797, zip: "75201" },
  Chicago: { state: "IL", lat: 41.8781, lng: -87.6298, zip: "60601" },
  Seattle: { state: "WA", lat: 47.6062, lng: -122.3321, zip: "98101" },
  Phoenix: { state: "AZ", lat: 33.4484, lng: -112.074, zip: "85001" },
  Denver: { state: "CO", lat: 39.7392, lng: -104.9903, zip: "80202" },
  Atlanta: { state: "GA", lat: 33.749, lng: -84.388, zip: "30303" },
};

const IMG = {
  bmw: ["photo-1555215695-3004980ad54e", "photo-1617788138017-80ad40651399", "photo-1580273916550-e323be2ae537"],
  porsche: ["photo-1503376780353-7e6692767b70", "photo-1614162692292-7ac56d7f7f1e", "photo-1606664515524-ed2f786a0bd6"],
  mustang: ["photo-1494976388531-d1058494cdd8", "photo-1584345604476-8ec5e12e42dd", "photo-1547744152-14d985cb937f"],
  corvette: ["photo-1552519507-da3b142c6e3d", "photo-1583121274602-3e2820c69888", "photo-1568605117036-5fe5e7bab0b7"],
  mercedes: ["photo-1618843479313-40f8afb4b4d8", "photo-1544636331-e26879cd4d9b", "photo-1553440569-bcc63803a83d"],
  tesla: ["photo-1560958089-b8a1929cea89", "photo-1617704548623-340376564e68", "photo-1571607388263-1044f9ea01dd"],
  suv: ["photo-1519641471654-76ce0107ad1b", "photo-1533473359331-0135ef1b58bf", "photo-1606611013016-969c19ba27bb"],
  truck: ["photo-1559416523-140ddc3d238c", "photo-1547549082-6bc09f2049ae", "photo-1533473359331-0135ef1b58bf"],
  classic: ["photo-1502877338535-766e1452684a", "photo-1489824904134-891ab64532f1", "photo-1541899481282-d53bffe3c35d"],
  exotic: ["photo-1542362567-b07e54358753", "photo-1592198084033-aade902d1aae", "photo-1511919884226-fd3cad34687c"],
  moto: ["photo-1558981806-ec527fa84c39", "photo-1568772585407-9361f9bf3a87", "photo-1609630875171-b1321377ee65"],
  sedan: ["photo-1549399542-7e3f8b79c341", "photo-1492144534655-ae79c964c9d7", "photo-1525609004556-c46c7d6cf023"],
  parts: ["photo-1486262715619-67b85e0b08d3", "photo-1487754180451-c456f719a1fc", "photo-1530046339160-ce3e530c7d2f"],
  van: ["photo-1532974297617-c0f05fe48bff", "photo-1527786356703-4b100091cd2c", "photo-1519641471654-76ce0107ad1b"],
};

const EVENT_IMG = [
  "photo-1504215680853-026ed2a45def",
  "photo-1511407397940-d57f68e81203",
  "photo-1532581140115-3e355d1ed1de",
  "photo-1541348263662-e068662d82af",
  "photo-1566024287286-457247b70310",
  "photo-1485291571150-772bcfc10da5",
  "photo-1495474472287-4d71bcdd2085",
  "photo-1580414057403-c5f451f30e1c",
];

const AVATARS = [
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1494790108377-be9c29b29330",
  "photo-1500648767791-00dcc994a43e",
  "photo-1438761681033-6461ffad8d80",
  "photo-1472099645785-5658abf4ff4e",
  "photo-1534528741775-53994a69daeb",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1544005313-94ddf0286df2",
];

type V = {
  cat: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  price: number;
  mileage: number;
  condition: VehicleCondition;
  body: BodyType;
  trans: Transmission;
  fuel: FuelType;
  engine: string;
  drive: Drivetrain;
  color: string;
  city: keyof typeof CITIES;
  img: keyof typeof IMG;
  featured?: boolean;
  features: string[];
  desc: string;
};

const VEHICLES: V[] = [
  { cat: "sports-cars", make: "BMW", model: "M3", trim: "Competition xDrive", year: 2024, price: 82500, mileage: 12400, condition: "USED", body: "SEDAN", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "3.0L Twin-Turbo I6 · 503 hp", drive: "AWD", color: "Isle of Man Green", city: "Miami", img: "bmw", featured: true, features: ["Carbon bucket seats", "M Drive Professional", "Head-up display", "Harman Kardon audio", "Adaptive cruise control"], desc: "One-owner M3 Competition xDrive in Isle of Man Green over Kyalami Orange leather. Carbon bucket seats, M Drive Professional, and a full PPF front end. Dealer-serviced with records, never tracked, and garage kept. Clean title and history report available." },
  { cat: "sports-cars", make: "Porsche", model: "911", trim: "Carrera S", year: 2022, price: 139900, mileage: 8900, condition: "CERTIFIED", body: "COUPE", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "3.0L Twin-Turbo Flat-6 · 443 hp", drive: "RWD", color: "GT Silver Metallic", city: "Los Angeles", img: "porsche", featured: true, features: ["Sport Chrono package", "Sport exhaust", "Front axle lift", "Bose audio", "Ventilated seats"], desc: "Porsche Approved Certified 992 Carrera S with Sport Chrono, sport exhaust, and front axle lift. Warranty through 2027. Pristine condition inside and out with a clear bra on the nose." },
  { cat: "cars", make: "Ford", model: "Mustang", trim: "GT Premium", year: 2021, price: 38900, mileage: 21400, condition: "USED", body: "COUPE", trans: "MANUAL", fuel: "GASOLINE", engine: "5.0L Coyote V8 · 460 hp", drive: "RWD", color: "Rapid Red", city: "Miami", img: "mustang", features: ["Performance package", "Active valve exhaust", "Recaro seats", "Apple CarPlay"], desc: "Six-speed manual Mustang GT Premium with the Performance Package. Active exhaust, Recaros, and MagneRide. Stock, never modified, and adult-owned." },
  { cat: "sports-cars", make: "Chevrolet", model: "Corvette", trim: "Stingray 3LT Z51", year: 2023, price: 84500, mileage: 5100, condition: "USED", body: "COUPE", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "6.2L LT2 V8 · 495 hp", drive: "RWD", color: "Amplify Orange", city: "Austin", img: "corvette", featured: true, features: ["Z51 package", "Front lift", "Performance data recorder", "Bose audio", "Heated seats"], desc: "C8 Stingray 3LT with Z51, front lift with memory, and the performance data recorder. Barely broken in, stored under a cover, and ready for the next owner." },
  { cat: "cars", make: "Mercedes-Benz", model: "C-Class", trim: "C 300 4MATIC", year: 2023, price: 44900, mileage: 14800, condition: "CERTIFIED", body: "SEDAN", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "2.0L Turbo I4 Mild Hybrid · 255 hp", drive: "AWD", color: "Obsidian Black", city: "New York", img: "mercedes", features: ["Panoramic roof", "Burmester audio", "360° camera", "Heated seats", "Navigation"], desc: "Mercedes-Benz Certified Pre-Owned C 300 4MATIC with the Premium and Driver Assistance packages. Remaining factory warranty plus CPO coverage." },
  { cat: "electric-vehicles", make: "Tesla", model: "Model 3", trim: "Long Range AWD", year: 2023, price: 34900, mileage: 18200, condition: "USED", body: "SEDAN", trans: "AUTOMATIC", fuel: "ELECTRIC", engine: "Dual Motor · 358 mi range", drive: "AWD", color: "Pearl White", city: "San Francisco", img: "tesla", featured: true, features: ["Autopilot", "Premium audio", "Glass roof", "Heated seats", "Wireless charging"], desc: "Model 3 Long Range in Pearl White with the white interior. Excellent battery health, one owner, and always charged at home. Includes the mobile connector and all-weather mats." },
  { cat: "electric-vehicles", make: "Tesla", model: "Model Y", trim: "Performance", year: 2022, price: 39500, mileage: 27600, condition: "USED", body: "SUV", trans: "AUTOMATIC", fuel: "ELECTRIC", engine: "Dual Motor · 303 mi range", drive: "AWD", color: "Midnight Silver", city: "Seattle", img: "tesla", features: ["Autopilot", "21\" Überturbine wheels", "Glass roof", "Tow package"], desc: "Model Y Performance with the tow hitch and 21-inch wheels. Clean title, no accidents, and new tires installed last month." },
  { cat: "suvs", make: "Porsche", model: "Cayenne", trim: "GTS", year: 2021, price: 92900, mileage: 31000, condition: "USED", body: "SUV", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "4.0L Twin-Turbo V8 · 453 hp", drive: "AWD", color: "Carmine Red", city: "Dallas", img: "suv", features: ["Sport Chrono package", "Panoramic roof", "Bose audio", "Adaptive air suspension", "Heated seats"], desc: "Cayenne GTS with the V8, Sport Chrono, and panoramic roof. Serviced at Porsche every year. A family hauler that genuinely drives like a sports car." },
  { cat: "suvs", make: "Toyota", model: "4Runner", trim: "TRD Pro", year: 2022, price: 51900, mileage: 24800, condition: "USED", body: "SUV", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "4.0L V6 · 270 hp", drive: "FOUR_WD", color: "Lunar Rock", city: "Denver", img: "suv", features: ["Crawl control", "Fox shocks", "Roof rack", "JBL audio", "Tow package"], desc: "TRD Pro 4Runner in Lunar Rock. Fox internal-bypass shocks, skid plate, and roof rack. Light trail use only, and it has never been off-road beyond forest service roads." },
  { cat: "suvs", make: "Toyota", model: "RAV4", trim: "Hybrid XSE", year: 2023, price: 36400, mileage: 11200, condition: "USED", body: "SUV", trans: "AUTOMATIC", fuel: "HYBRID", engine: "2.5L Hybrid I4 · 219 hp", drive: "AWD", color: "Blueprint", city: "Atlanta", img: "suv", features: ["Apple CarPlay", "Sunroof", "Heated seats", "Lane keep assist", "Blind spot monitoring"], desc: "RAV4 Hybrid XSE with the two-tone roof and the Premium package. Averaging 41 mpg. Non-smoker, with a spotless interior." },
  { cat: "trucks", make: "Ford", model: "F-150", trim: "Raptor", year: 2022, price: 78900, mileage: 19800, condition: "USED", body: "PICKUP", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "3.5L EcoBoost V6 · 450 hp", drive: "FOUR_WD", color: "Code Orange", city: "Phoenix", img: "truck", featured: true, features: ["37\" performance package", "Fox Live Valve shocks", "B&O audio", "360° camera", "Tow package"], desc: "Gen 3 Raptor with the 37-inch package. Fox Live Valve shocks, B&O audio, and the moonroof. Never jumped, and used mostly as a daily driver." },
  { cat: "trucks", make: "Ram", model: "1500", trim: "TRX", year: 2023, price: 89900, mileage: 9400, condition: "USED", body: "PICKUP", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "6.2L Supercharged HEMI V8 · 702 hp", drive: "FOUR_WD", color: "Diamond Black", city: "Dallas", img: "truck", features: ["Head-up display", "Panoramic roof", "Harman Kardon audio", "Adaptive cruise control"], desc: "Ram TRX with the Level 2 package, carbon fiber interior trim, and a panoramic roof. Ridiculously fast, and the paint is still perfect." },
  { cat: "trucks", make: "Chevrolet", model: "Silverado 1500", trim: "LT Trail Boss", year: 2021, price: 42900, mileage: 38200, condition: "USED", body: "PICKUP", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "5.3L V8 · 355 hp", drive: "FOUR_WD", color: "Summit White", city: "Austin", img: "truck", features: ["Z71 package", "Tow package", "Apple CarPlay", "Backup camera"], desc: "Trail Boss with the factory lift and Z71 package. Spray-in bedliner and tonneau cover. Excellent tow rig." },
  { cat: "classic-cars", make: "Porsche", model: "911", trim: "Carrera 3.2", year: 1987, price: 94500, mileage: 88000, condition: "USED", body: "COUPE", trans: "MANUAL", fuel: "GASOLINE", engine: "3.2L Flat-6 · 214 hp", drive: "RWD", color: "Guards Red", city: "Los Angeles", img: "classic", featured: true, features: ["G50 gearbox", "Sunroof", "Fuchs wheels"], desc: "Late G50 Carrera 3.2 in Guards Red. Top-end rebuild at 80k, documented history since new, and matching numbers. A proper air-cooled driver." },
  { cat: "classic-cars", make: "Ford", model: "Mustang", trim: "Fastback", year: 1967, price: 74900, mileage: 62000, condition: "USED", body: "COUPE", trans: "MANUAL", fuel: "GASOLINE", engine: "289 V8 · 225 hp", drive: "RWD", color: "Highland Green", city: "Chicago", img: "classic", features: ["Disc brake conversion", "Power steering", "Restored interior"], desc: "Restored '67 fastback in Highland Green. Rebuilt 289, four-speed Toploader, and front disc brakes. Turns heads everywhere it goes." },
  { cat: "classic-cars", make: "Chevrolet", model: "Camaro", trim: "SS 396", year: 1969, price: 89000, mileage: 54000, condition: "USED", body: "COUPE", trans: "MANUAL", fuel: "GASOLINE", engine: "396 Big Block V8 · 375 hp", drive: "RWD", color: "Hugger Orange", city: "Atlanta", img: "classic", features: ["Muncie 4-speed", "Cowl induction", "Restomod suspension"], desc: "A tasteful restomod '69 SS with a big block, Muncie 4-speed, and modern suspension and brakes. It drives as good as it looks." },
  { cat: "sports-cars", make: "Audi", model: "R8", trim: "V10 Performance", year: 2020, price: 159900, mileage: 11200, condition: "USED", body: "COUPE", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "5.2L V10 · 602 hp", drive: "AWD", color: "Kemora Gray", city: "Miami", img: "exotic", features: ["Carbon ceramic brakes", "Bang & Olufsen audio", "Carbon package", "Sport exhaust"], desc: "R8 V10 Performance with carbon ceramics and the carbon exterior package. The last of the naturally aspirated V10s. Fresh service completed." },
  { cat: "sports-cars", make: "Nissan", model: "GT-R", trim: "Premium", year: 2019, price: 99500, mileage: 16800, condition: "USED", body: "COUPE", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "3.8L Twin-Turbo V6 · 565 hp", drive: "AWD", color: "Pearl White", city: "Los Angeles", img: "exotic", features: ["Bose audio", "Navigation", "Heated seats", "Backup camera"], desc: "Stock GT-R Premium with a transmission service completed at 15k. Never modified. The perfect blank canvas." },
  { cat: "cars", make: "Honda", model: "Civic", trim: "Type R", year: 2023, price: 47900, mileage: 6200, condition: "USED", body: "HATCHBACK", trans: "MANUAL", fuel: "GASOLINE", engine: "2.0L Turbo I4 · 315 hp", drive: "FWD", color: "Championship White", city: "San Francisco", img: "sedan", features: ["Brembo brakes", "Rev matching", "Apple CarPlay", "Adaptive cruise control"], desc: "FL5 Type R in Championship White. Paid over MSRP, and now it's your chance to get one at a fair price. Full PPF and ceramic coating." },
  { cat: "cars", make: "Toyota", model: "GR86", trim: "Premium", year: 2023, price: 31900, mileage: 9800, condition: "USED", body: "COUPE", trans: "MANUAL", fuel: "GASOLINE", engine: "2.4L Flat-4 · 228 hp", drive: "RWD", color: "Track bRED", city: "Orlando", img: "sedan", features: ["Heated seats", "Apple CarPlay", "Sport exhaust"], desc: "Six-speed GR86 Premium. Fun, balanced, and cheap to run. Includes an extra set of winter wheels." },
  { cat: "cars", make: "BMW", model: "M5", trim: "Competition", year: 2021, price: 86900, mileage: 22400, condition: "CERTIFIED", body: "SEDAN", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "4.4L Twin-Turbo V8 · 617 hp", drive: "AWD", color: "Tanzanite Blue", city: "New York", img: "bmw", features: ["Bowers & Wilkins audio", "Carbon ceramic brakes", "Ventilated seats", "Head-up display", "Soft-close doors"], desc: "BMW CPO M5 Competition in Tanzanite Blue II with Bowers & Wilkins audio and carbon ceramics. The ultimate four-door sleeper." },
  { cat: "cars", make: "Mercedes-Benz", model: "AMG GT", trim: "63 S 4-Door", year: 2022, price: 129500, mileage: 12900, condition: "USED", body: "SEDAN", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "4.0L Twin-Turbo V8 · 630 hp", drive: "AWD", color: "Selenite Gray", city: "Miami", img: "mercedes", features: ["AMG Dynamic Plus", "Burmester 3D audio", "Carbon package", "Panoramic roof"], desc: "AMG GT 63 S 4-Door Coupe with the Dynamic Plus package. Burmester High-End 3D audio and a carbon aero package. Stunning spec." },
  { cat: "electric-vehicles", make: "Porsche", model: "Taycan", trim: "4S", year: 2022, price: 88900, mileage: 15600, condition: "CERTIFIED", body: "SEDAN", trans: "AUTOMATIC", fuel: "ELECTRIC", engine: "Dual Motor · Performance Battery Plus", drive: "AWD", color: "Frozen Blue", city: "Los Angeles", img: "porsche", features: ["Performance Battery Plus", "Panoramic roof", "Bose audio", "Adaptive air suspension"], desc: "Taycan 4S with Performance Battery Plus in Frozen Blue. Porsche Approved warranty. The best-driving EV on sale." },
  { cat: "electric-vehicles", make: "Rivian", model: "R1T", trim: "Adventure Quad", year: 2023, price: 68900, mileage: 14100, condition: "USED", body: "PICKUP", trans: "AUTOMATIC", fuel: "ELECTRIC", engine: "Quad Motor · 328 mi range", drive: "AWD", color: "Launch Green", city: "Denver", img: "truck", features: ["Gear tunnel", "Air suspension", "Tow package", "Panoramic roof"], desc: "R1T Quad Motor with the Large pack. Includes the gear tunnel storage kit and the powered tonneau." },
  { cat: "motorcycles", make: "Ducati", model: "Panigale V4", trim: "S", year: 2022, price: 27900, mileage: 3100, condition: "USED", body: "MOTORCYCLE", trans: "MANUAL", fuel: "GASOLINE", engine: "1,103cc Desmosedici Stradale V4 · 214 hp", drive: "RWD", color: "Ducati Red", city: "Miami", img: "moto", featured: true, features: ["Öhlins suspension", "Quickshifter", "Akrapovič exhaust"], desc: "Panigale V4 S with Öhlins electronic suspension and a full Akrapovič system (stock exhaust included). Never dropped, and the chain is freshly serviced." },
  { cat: "motorcycles", make: "Harley-Davidson", model: "Street Glide", trim: "Special", year: 2021, price: 22900, mileage: 8900, condition: "USED", body: "MOTORCYCLE", trans: "MANUAL", fuel: "GASOLINE", engine: "Milwaukee-Eight 114 · 1,868cc", drive: "RWD", color: "Vivid Black", city: "Austin", img: "moto", features: ["Stage 1 upgrade", "Infotainment", "Cruise control"], desc: "Street Glide Special with a Stage 1 upgrade and a Screamin' Eagle intake. Well cared for and ready to tour." },
  { cat: "motorcycles", make: "Kawasaki", model: "Ninja ZX-6R", year: 2023, price: 10900, mileage: 2400, condition: "USED", body: "MOTORCYCLE", trans: "MANUAL", fuel: "GASOLINE", engine: "636cc Inline-4 · 127 hp", drive: "RWD", color: "Lime Green", city: "Orlando", img: "moto", features: ["Quickshifter", "Traction control", "Frame sliders"], desc: "Almost-new ZX-6R with frame sliders and a tail tidy. Garage kept, and it has never seen rain." },
  { cat: "motorcycles", make: "BMW", model: "R 1250 GS", trim: "Adventure", year: 2022, price: 21500, mileage: 12600, condition: "USED", body: "MOTORCYCLE", trans: "MANUAL", fuel: "GASOLINE", engine: "1,254cc Boxer Twin · 136 hp", drive: "RWD", color: "Triple Black", city: "Seattle", img: "moto", features: ["Aluminum panniers", "Heated grips", "Riding modes Pro"], desc: "GS Adventure with aluminum panniers, heated grips, and crash bars. Ready to go anywhere." },
  { cat: "vans", make: "Mercedes-Benz", model: "Sprinter", trim: "2500 High Roof 4x4", year: 2021, price: 72900, mileage: 34200, condition: "USED", body: "VAN", trans: "AUTOMATIC", fuel: "DIESEL", engine: "3.0L Turbo-Diesel V6", drive: "FOUR_WD", color: "Arctic White", city: "Denver", img: "van", features: ["Camper build-out", "Solar panels", "Roof rack", "Backup camera"], desc: "Professionally built 4x4 Sprinter camper with 400W solar, a lithium battery bank, a fixed bed, and a galley. Adventure-ready." },
  { cat: "vans", make: "Ford", model: "Transit", trim: "350 Cargo", year: 2022, price: 41900, mileage: 28100, condition: "USED", body: "VAN", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "3.5L EcoBoost V6", drive: "AWD", color: "Oxford White", city: "Chicago", img: "van", features: ["Shelving", "Tow package", "Backup camera"], desc: "Transit 350 high-roof cargo with AWD and interior shelving. A reliable work van with fleet maintenance records." },
  { cat: "suvs", make: "Land Rover", model: "Defender", trim: "110 X", year: 2023, price: 97500, mileage: 7200, condition: "USED", body: "SUV", trans: "AUTOMATIC", fuel: "HYBRID", engine: "3.0L Mild Hybrid I6 · 395 hp", drive: "FOUR_WD", color: "Gondwana Stone", city: "Seattle", img: "suv", features: ["Air suspension", "Meridian audio", "Tow package", "360° camera", "Heated seats"], desc: "Defender 110 X with the Advanced Off-Road Capability pack and a Meridian sound system. Spotless, with remaining factory warranty." },
  { cat: "suvs", make: "Jeep", model: "Wrangler", trim: "Rubicon 392", year: 2022, price: 74900, mileage: 16300, condition: "USED", body: "SUV", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "6.4L HEMI V8 · 470 hp", drive: "FOUR_WD", color: "Firecracker Red", city: "Phoenix", img: "suv", features: ["Sky One-Touch roof", "Tow package", "Alpine audio"], desc: "Rubicon 392 with the Sky One-Touch power top. A V8 Wrangler — enough said." },
  { cat: "cars", make: "Audi", model: "RS 6 Avant", year: 2022, price: 112900, mileage: 18900, condition: "USED", body: "WAGON", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "4.0L Twin-Turbo V8 · 591 hp", drive: "AWD", color: "Nardo Gray", city: "San Francisco", img: "sedan", features: ["Carbon ceramic brakes", "Bang & Olufsen audio", "Head-up display", "Panoramic roof"], desc: "Nardo Gray RS 6 Avant with the Executive and Black Optic packages and carbon ceramics. The ultimate wagon." },
  { cat: "cars", make: "Mazda", model: "MX-5 Miata", trim: "Club RF", year: 2022, price: 29500, mileage: 10200, condition: "USED", body: "CONVERTIBLE", trans: "MANUAL", fuel: "GASOLINE", engine: "2.0L I4 · 181 hp", drive: "RWD", color: "Soul Red Crystal", city: "Orlando", img: "sedan", features: ["Brembo brakes", "BBS wheels", "Recaro seats", "Apple CarPlay"], desc: "Miata RF Club with the Brembo/BBS/Recaro package. Top down, smile on. Always garaged." },
  { cat: "cars", make: "Volkswagen", model: "Golf R", year: 2022, price: 39900, mileage: 17600, condition: "USED", body: "HATCHBACK", trans: "MANUAL", fuel: "GASOLINE", engine: "2.0L Turbo I4 · 315 hp", drive: "AWD", color: "Lapiz Blue", city: "New York", img: "sedan", features: ["Harman Kardon audio", "Heated seats", "Adaptive cruise control"], desc: "Mk8 Golf R with the six-speed manual in Lapiz Blue. A practical daily driver that's fast in any weather." },
  { cat: "sports-cars", make: "Lamborghini", model: "Huracán", trim: "EVO", year: 2021, price: 249900, mileage: 6100, condition: "USED", body: "COUPE", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "5.2L V10 · 631 hp", drive: "AWD", color: "Verde Mantis", city: "Miami", img: "exotic", features: ["Front lift", "Sport exhaust", "Carbon package", "Navigation"], desc: "Huracán EVO in Verde Mantis with a front lift and carbon interior. Serviced by Lamborghini Miami. Unforgettable." },
  { cat: "parts-accessories", make: "BBS", model: "FI-R Forged Wheels", trim: "20\" 5x112", year: 2023, price: 6400, mileage: 0, condition: "NEW", body: "OTHER", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "N/A", drive: "RWD", color: "Platinum Silver", city: "Los Angeles", img: "parts", features: ["Forged monoblock", "Center lock look"], desc: "Brand-new set of BBS FI-R forged wheels, 20x9 front and 20x10.5 rear, 5x112. Never mounted, in their original boxes." },
  { cat: "parts-accessories", make: "Akrapovič", model: "Evolution Line Exhaust", trim: "Titanium", year: 2022, price: 5200, mileage: 1200, condition: "USED", body: "OTHER", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "N/A", drive: "RWD", color: "Titanium", city: "Dallas", img: "parts", features: ["Titanium construction", "Carbon tips"], desc: "Akrapovič Evolution titanium exhaust removed from a G80 M3 after 1,200 miles. It includes all hardware and the carbon tips." },
  { cat: "cars", make: "Lexus", model: "IS 500", trim: "F Sport Performance", year: 2023, price: 56900, mileage: 8300, condition: "USED", body: "SEDAN", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "5.0L V8 · 472 hp", drive: "RWD", color: "Incognito", city: "Atlanta", img: "sedan", features: ["Mark Levinson audio", "Heated seats", "Navigation", "Blind spot monitoring"], desc: "A naturally aspirated V8 sport sedan with Lexus reliability. Mark Levinson audio and a triple-beam LED package." },
  { cat: "sports-cars", make: "Ferrari", model: "F8 Tributo", year: 2021, price: 319000, mileage: 4800, condition: "USED", body: "COUPE", trans: "AUTOMATIC", fuel: "GASOLINE", engine: "3.9L Twin-Turbo V8 · 710 hp", drive: "RWD", color: "Rosso Corsa", city: "Los Angeles", img: "exotic", features: ["Carbon ceramic brakes", "Front lift", "Carbon racing seats", "Sport exhaust"], desc: "F8 Tributo in Rosso Corsa with carbon racing seats and a passenger display. Seven years of maintenance remaining." },
];

const USERS = [
  { name: "Alex Rivera", username: "alexr", email: "alex@street-car.dev", city: "Miami", state: "FL", sellerType: "PRIVATE" as const, bio: "Weekend canyon carver, M-car loyalist, and Cars & Coffee regular. Always down to talk about manual swaps." },
  { name: "Premier Auto Group", username: "premierauto", email: "sales@premierauto.dev", city: "Los Angeles", state: "CA", sellerType: "DEALER" as const, bio: "Southern California's destination for certified pre-owned performance and luxury vehicles since 2004." },
  { name: "Jordan Lee", username: "jlee_drives", email: "jordan@street-car.dev", city: "Austin", state: "TX", sellerType: "PRIVATE" as const, bio: "Truck guy by day, track rat by weekend. Organizer of the Austin Sunday Meet." },
  { name: "Sofia Martinez", username: "sofiam", email: "sofia@street-car.dev", city: "San Francisco", state: "CA", sellerType: "PRIVATE" as const, bio: "EV enthusiast and hot hatch fan. I review everything I drive." },
  { name: "Lone Star Motors", username: "lonestarmotors", email: "hello@lonestarmotors.dev", city: "Dallas", state: "TX", sellerType: "DEALER" as const, bio: "Trucks, SUVs, and performance. Family owned and Texas proud." },
  { name: "Marcus Chen", username: "marcus_c", email: "marcus@street-car.dev", city: "New York", state: "NY", sellerType: "PRIVATE" as const, bio: "German sedans and air-cooled Porsches. Collector since 2010." },
  { name: "Emily Carter", username: "emcarter", email: "emily@street-car.dev", city: "Denver", state: "CO", sellerType: "PRIVATE" as const, bio: "Overlanding, van life, and mountain passes." },
  { name: "Daniel Brooks", username: "dbrooks", email: "daniel@street-car.dev", city: "Chicago", state: "IL", sellerType: "PRIVATE" as const, bio: "Classic muscle restorer. If it has carburetors, I'm interested." },
];

const EVENTS: { title: string; type: EventType; city: keyof typeof CITIES; venue: string; days: number; start: string; end: string; max?: number; desc: string; featured?: boolean }[] = [
  { title: "Miami Sunrise Cars & Coffee", type: "CARS_AND_COFFEE", city: "Miami", venue: "Bayfront Park North Lot", days: 4, start: "07:30", end: "10:30", desc: "Our monthly sunrise gathering by the bay. Every make and model is welcome — exotics, classics, tuners, and daily drivers. Free coffee for the first 100 guests. Please no burnouts, revving, or loud exits.", featured: true },
  { title: "Laguna Seca Track Day", type: "TRACK_DAY", city: "Los Angeles", venue: "WeatherTech Raceway Laguna Seca", days: 18, start: "08:00", end: "17:00", max: 60, desc: "A full day of open-lapping with run groups for novice, intermediate, and advanced drivers. Instructors are available for first-timers. A helmet (SA2015 or newer) and tech inspection are required.", featured: true },
  { title: "Austin Sunday Meet", type: "CAR_MEET", city: "Austin", venue: "Domain Northside Garage, Level 4", days: 6, start: "18:00", end: "21:00", desc: "A relaxed evening meet on the rooftop. Bring your ride, grab some food trucks, and meet the Austin car community. Respect the spot so we can keep coming back." },
  { title: "Concours on the Green", type: "CAR_SHOW", city: "Chicago", venue: "Cantigny Park", days: 25, start: "10:00", end: "16:00", max: 400, desc: "A judged concours featuring pre-war classics, post-war sports cars, and American muscle. Awards ceremony at 3 PM. Spectator tickets include museum access.", featured: true },
  { title: "Tuner Evolution Expo", type: "TUNING", city: "Los Angeles", venue: "LA Convention Center, Hall B", days: 32, start: "11:00", end: "19:00", desc: "Showcasing the best builds on the West Coast, with dyno competitions, vendor booths, and live wraps. Car registration is open for show entries." },
  { title: "Moto Night: Two Wheels Only", type: "MOTORCYCLE_MEET", city: "Orlando", venue: "Wall Street Plaza", days: 9, start: "19:00", end: "22:00", desc: "Sportbikes, cruisers, adventure bikes, and café racers. Meet riders from all over Central Florida. Gear up and ride safe." },
  { title: "Dallas Truck Takeover", type: "CAR_MEET", city: "Dallas", venue: "Texas Motor Speedway Lot 6", days: 14, start: "16:00", end: "21:00", desc: "Lifted, lowered, off-road, or stock — all trucks welcome. Contests for best build, best lift, and best sound system." },
  { title: "Porsche Club Mountain Drive", type: "CLUB", city: "Denver", venue: "Red Rocks Park Lower Lot", days: 21, start: "08:30", end: "14:00", max: 40, desc: "A guided scenic drive through the foothills followed by lunch in Evergreen. Open to all Porsche models. Registration required." },
  { title: "Autocross Series: Round 4", type: "RACING", city: "Phoenix", venue: "Wild Horse Pass Motorsports Park", days: 11, start: "07:00", end: "16:00", max: 120, desc: "Timed runs through a cone course. All skill levels are welcome, with classes based on vehicle prep. Loaner helmets are available." },
  { title: "Electric Avenue: EV Meetup", type: "CAR_MEET", city: "San Francisco", venue: "Pier 70", days: 16, start: "10:00", end: "13:00", desc: "Talk range, charging, and mods with fellow EV owners. Test-drive opportunities from owners who want to share their cars." },
];

const PASSWORD = "StreetCar2026";

function daysFromNow(days: number, time: string) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h!, m!, 0, 0);
  return d;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  console.log("🧹 Clearing database…");
  await db.$transaction([
    db.notification.deleteMany(),
    db.report.deleteMany(),
    db.message.deleteMany(),
    db.conversationParticipant.deleteMany(),
    db.conversation.deleteMany(),
    db.offer.deleteMany(),
    db.tradeProposal.deleteMany(),
    db.favorite.deleteMany(),
    db.review.deleteMany(),
    db.eventAttendee.deleteMany(),
    db.event.deleteMany(),
    db.vehicleImage.deleteMany(),
    db.vehicle.deleteMany(),
    db.garageVehicle.deleteMany(),
    db.follow.deleteMany(),
    db.category.deleteMany(),
    db.passwordResetToken.deleteMany(),
    db.account.deleteMany(),
    db.session.deleteMany(),
    db.user.deleteMany(),
  ]);

  console.log("🏷️  Categories…");
  const categoryDefs = [
    ["cars", "Cars", "photo-1492144534655-ae79c964c9d7"],
    ["motorcycles", "Motorcycles", "photo-1558981806-ec527fa84c39"],
    ["trucks", "Trucks", "photo-1559416523-140ddc3d238c"],
    ["suvs", "SUVs", "photo-1519641471654-76ce0107ad1b"],
    ["vans", "Vans", "photo-1532974297617-c0f05fe48bff"],
    ["classic-cars", "Classic Cars", "photo-1502877338535-766e1452684a"],
    ["sports-cars", "Sports Cars", "photo-1503376780353-7e6692767b70"],
    ["electric-vehicles", "Electric Vehicles", "photo-1560958089-b8a1929cea89"],
    ["parts-accessories", "Parts & Accessories", "photo-1486262715619-67b85e0b08d3"],
  ] as const;
  const categories = new Map<string, string>();
  for (const [i, [slug, name, img]] of categoryDefs.entries()) {
    const c = await db.category.create({ data: { slug, name, image: u(img, 800), sortOrder: i } });
    categories.set(slug, c.id);
  }

  console.log("👤 Users…");
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const admin = await db.user.create({
    data: {
      name: "Street-Car Admin",
      username: "admin",
      email: "admin@street-car.dev",
      passwordHash,
      role: "ADMIN",
      city: "Miami",
      state: "FL",
      country: "United States",
      bio: "Keeping the Street-Car community safe and fast.",
      emailVerified: new Date(),
    },
  });
  const users = [];
  for (const [i, data] of USERS.entries()) {
    users.push(
      await db.user.create({
        data: {
          ...data,
          country: "United States",
          passwordHash,
          image: u(AVATARS[i % AVATARS.length]!, 256),
          emailVerified: new Date(),
          createdAt: new Date(Date.now() - (400 - i * 30) * 86400000),
          lastSeenAt: new Date(Date.now() - i * 3600000),
        },
      }),
    );
  }
  const [alex, premier, jordan, sofia, lonestar, marcus, emily, daniel] = users as [typeof admin, typeof admin, typeof admin, typeof admin, typeof admin, typeof admin, typeof admin, typeof admin];

  const sellerFor = (v: V) => {
    if (["Premier", "Porsche", "Audi", "Ferrari", "Lamborghini"].includes(v.make) && v.year > 2000) return premier;
    if (v.cat === "trucks" || (v.city === "Dallas" && v.cat !== "parts-accessories")) return lonestar;
    const byCity: Record<string, typeof admin> = {
      Miami: alex, Austin: jordan, "San Francisco": sofia, "New York": marcus, Denver: emily, Chicago: daniel,
      Orlando: alex, Seattle: sofia, Phoenix: jordan, Atlanta: marcus, "Los Angeles": premier, Dallas: lonestar,
    };
    return byCity[v.city] ?? alex;
  };

  console.log("🚗 Vehicles…");
  const vehicles = [];
  for (const [i, v] of VEHICLES.entries()) {
    const city = CITIES[v.city]!;
    const seller = sellerFor(v);
    const title = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
    const imgs = IMG[v.img];
    const rotated = [...imgs.slice(i % imgs.length), ...imgs.slice(0, i % imgs.length)];
    vehicles.push(
      await db.vehicle.create({
        data: {
          slug: `${slugify(title)}-${(i + 1).toString(36).padStart(4, "0")}`,
          sellerId: seller.id,
          categoryId: categories.get(v.cat)!,
          make: v.make,
          model: v.model,
          trim: v.trim,
          year: v.year,
          price: v.price,
          mileage: v.mileage,
          condition: v.condition,
          bodyType: v.body,
          transmission: v.trans,
          fuelType: v.fuel,
          engine: v.engine,
          drivetrain: v.drive,
          exteriorColor: v.color,
          interiorColor: "Black",
          description: v.desc,
          features: v.features,
          city: v.city,
          state: city.state,
          country: "United States",
          postalCode: city.zip,
          latitude: city.lat,
          longitude: city.lng,
          isFeatured: Boolean(v.featured),
          openToTrade: i % 3 !== 2,
          views: 150 + ((i * 97) % 1800),
          createdAt: new Date(Date.now() - i * 7.5 * 3600000),
          images: { create: rotated.map((id, order) => ({ url: u(id), order, alt: `${title} photo ${order + 1}` })) },
        },
      }),
    );
  }
  // A couple of sold listings for stats.
  await db.vehicle.updateMany({ where: { id: { in: [vehicles[14]!.id, vehicles[33]!.id] } }, data: { status: "SOLD", soldAt: new Date() } });

  console.log("📅 Events…");
  const organizers = [alex, premier, jordan, daniel, premier, alex, lonestar, emily, jordan, sofia];
  const events = [];
  for (const [i, e] of EVENTS.entries()) {
    const city = CITIES[e.city]!;
    events.push(
      await db.event.create({
        data: {
          slug: `${slugify(e.title)}-${(i + 1).toString(36).padStart(4, "0")}`,
          organizerId: organizers[i]!.id,
          title: e.title,
          description: e.desc,
          type: e.type,
          startsAt: daysFromNow(e.days, e.start),
          endsAt: daysFromNow(e.days, e.end),
          venue: e.venue,
          city: e.city,
          state: city.state,
          country: "United States",
          coverImage: u(EVENT_IMG[i % EVENT_IMG.length]!),
          maxAttendees: e.max,
          isFeatured: Boolean(e.featured),
        },
      }),
    );
  }
  const everyone = [admin, ...users];
  for (const [i, event] of events.entries()) {
    const going = everyone.filter((_, j) => (i + j) % 3 !== 0 || everyone[j]!.id === event.organizerId);
    for (const [j, user] of going.entries()) {
      await db.eventAttendee.create({ data: { eventId: event.id, userId: user.id, status: j % 4 === 3 ? "INTERESTED" : "GOING" } });
    }
  }

  console.log("⭐ Reviews, follows, garage…");
  const reviewPairs: [typeof admin, typeof admin, number, string][] = [
    [alex, premier, 5, "Smooth, transparent purchase. The car was exactly as described, and the paperwork took 20 minutes."],
    [sofia, premier, 5, "Premier made buying my first Porsche stress-free. Highly recommend."],
    [marcus, premier, 4, "Great selection and fair pricing. Delivery took a few days longer than planned."],
    [jordan, alex, 5, "Alex is a true enthusiast. The car was meticulously maintained with every record."],
    [daniel, alex, 5, "Honest seller, quick replies, and a smooth trade. Would deal with him again."],
    [emily, lonestar, 4, "Solid truck and a straightforward process. They even detailed it before pickup."],
    [alex, jordan, 5, "Jordan runs the best meets in Austin and is an honest seller too."],
    [marcus, sofia, 5, "Very knowledgeable about EVs, and a flawless transaction."],
    [sofia, marcus, 5, "Marcus's cars are always immaculate. A real collector."],
  ];
  for (const [author, target, rating, comment] of reviewPairs) {
    await db.review.create({ data: { authorId: author.id, targetUserId: target.id, rating, comment } });
  }
  for (const [a, b] of [[alex, premier], [alex, jordan], [sofia, alex], [marcus, alex], [jordan, alex], [daniel, marcus], [emily, jordan]] as const) {
    await db.follow.create({ data: { followerId: a.id, followingId: b.id } });
  }
  await db.garageVehicle.createMany({
    data: [
      { ownerId: alex.id, make: "BMW", model: "M2 CS", year: 2020, image: u(IMG.bmw[1]!, 1000), notes: "Daily driver and occasional track toy." },
      { ownerId: alex.id, make: "Porsche", model: "Cayman GT4", year: 2016, image: u(IMG.porsche[0]!, 1000), notes: "Weekend car. Never selling." },
      { ownerId: jordan.id, make: "Ford", model: "Bronco Raptor", year: 2023, image: u(IMG.suv[0]!, 1000) },
      { ownerId: sofia.id, make: "Hyundai", model: "Ioniq 5 N", year: 2025, image: u(IMG.tesla[1]!, 1000) },
      { ownerId: marcus.id, make: "Porsche", model: "964 Carrera 4", year: 1991, image: u(IMG.classic[0]!, 1000) },
    ],
  });

  console.log("❤️  Favorites…");
  for (const [i, v] of vehicles.entries()) {
    if (i % 4 === 0 && v.sellerId !== alex.id) await db.favorite.create({ data: { userId: alex.id, vehicleId: v.id } });
    if (i % 5 === 1 && v.sellerId !== sofia.id) await db.favorite.create({ data: { userId: sofia.id, vehicleId: v.id } });
  }
  await db.favorite.create({ data: { userId: alex.id, eventId: events[1]!.id } });
  await db.favorite.create({ data: { userId: alex.id, sellerId: premier.id } });

  console.log("💬 Conversations, offers, trades…");
  const porsche911 = vehicles[1]!; // Premier's 911
  const convo = await db.conversation.create({
    data: {
      vehicleId: porsche911.id,
      participants: { create: [{ userId: alex.id, lastReadAt: new Date() }, { userId: premier.id }] },
    },
  });
  const t0 = Date.now() - 3 * 3600000;
  const script: [typeof admin, string][] = [
    [alex, "Hi! Is the 911 Carrera S still available?"],
    [premier, "Hi Alex, yes it is! It just came back from a full detail. Would you like to schedule a test drive?"],
    [alex, "Definitely. Does it have the rear-axle steering option?"],
    [premier, "It does not, but it has Sport Chrono, the sport exhaust, and the front lift. Happy to send a walkaround video."],
  ];
  for (const [i, [sender, content]] of script.entries()) {
    await db.message.create({
      data: {
        conversationId: convo.id,
        senderId: sender.id,
        receiverId: sender.id === alex.id ? premier.id : alex.id,
        content,
        createdAt: new Date(t0 + i * 6 * 60000),
        readAt: new Date(t0 + i * 6 * 60000 + 60000),
      },
    });
  }
  const offer = await db.offer.create({
    data: { vehicleId: porsche911.id, buyerId: alex.id, sellerId: premier.id, amount: 132000, message: "Would you consider $132k with a quick close this week?" },
  });
  await db.message.create({
    data: { conversationId: convo.id, senderId: alex.id, receiverId: premier.id, type: "OFFER", content: offer.message!, offerId: offer.id, vehicleId: porsche911.id, createdAt: new Date(t0 + 30 * 60000) },
  });
  await db.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(t0 + 30 * 60000) } });

  // Trade: Jordan offers his Silverado for Alex's Mustang GT.
  const mustang = vehicles.find((v) => v.make === "Ford" && v.model === "Mustang" && v.year === 2021)!;
  const silverado = vehicles.find((v) => v.model === "Silverado 1500")!;
  await db.vehicle.update({ where: { id: silverado.id }, data: { sellerId: jordan.id } });
  const trade = await db.tradeProposal.create({
    data: {
      senderId: jordan.id,
      receiverId: mustang.sellerId,
      offeredVehicleId: silverado.id,
      requestedVehicleId: mustang.id,
      cashDifference: 2500,
      message: "Looking to get back into something fun. I'll add $2,500 on top of my Trail Boss. It's in great shape and tows like a dream.",
    },
  });
  const tradeConvo = await db.conversation.create({
    data: { vehicleId: mustang.id, participants: { create: [{ userId: jordan.id, lastReadAt: new Date() }, { userId: mustang.sellerId }] } },
  });
  await db.message.create({
    data: { conversationId: tradeConvo.id, senderId: jordan.id, receiverId: mustang.sellerId, type: "TRADE", content: trade.message!, tradeProposalId: trade.id },
  });

  console.log("🔔 Notifications…");
  await db.notification.createMany({
    data: [
      { userId: alex.id, actorId: jordan.id, type: "TRADE_PROPOSAL", title: "New trade proposal", body: "2021 Chevrolet Silverado 1500 (+ $2,500 cash) for your 2021 Ford Mustang", link: "/dashboard/trades" },
      { userId: alex.id, actorId: sofia.id, type: "NEW_FOLLOWER", title: "New follower", body: "Sofia Martinez started following you.", link: "/u/sofiam" },
      { userId: alex.id, actorId: daniel.id, type: "NEW_REVIEW", title: "New review", body: "Daniel Brooks left you a 5-star review.", link: "/u/alexr?tab=reviews", readAt: new Date() },
      { userId: alex.id, type: "EVENT_REMINDER", title: "Event coming up", body: "Miami Sunrise Cars & Coffee is this weekend. See you there!", link: `/events/${events[0]!.slug}` },
      { userId: premier.id, actorId: alex.id, type: "NEW_OFFER", title: "New offer received", body: "$132,000 for your 2022 Porsche 911 Carrera S", link: "/dashboard/offers" },
    ],
  });

  await db.report.create({
    data: { reporterId: sofia.id, vehicleId: vehicles[36]!.id, reason: "MISLEADING", details: "The mileage in the photos doesn't match the listing." },
  });

  console.log("\n✅ Seed complete.");
  console.log(`   Demo login:  alex@street-car.dev / ${PASSWORD}`);
  console.log(`   Admin login: admin@street-car.dev / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
