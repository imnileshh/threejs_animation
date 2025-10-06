import Navbar from '../components/Navbar';
import ParticleBackground from '../components/ParticleBackground';

export default function Home() {
    return (
        <main className="relative min-h-screen bg-white">
            <ParticleBackground />
            {/* <LogoModel /> */}
            <Navbar />

            <div className="h-[300vh]"></div>
            {/* <HeroSection /> */}
            {/* <CubeScroll /> */}
            {/* <Particle /> */}
            {/* <StarfieldBackground /> */}
            {/* <ThreeScene /> */}
            {/* <TubeEffect /> */}
        </main>
    );
}
