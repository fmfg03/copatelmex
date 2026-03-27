import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TournamentInfo } from "@/components/TournamentInfo";
import { SponsorsCarousel } from "@/components/SponsorsCarousel";
import { Categories } from "@/components/Categories";
import { NewsSection } from "@/components/NewsSection";
import { VideoFeedSection } from "@/components/VideoFeedSection";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <TournamentInfo />
      <Categories />
      <SponsorsCarousel />
      <VideoFeedSection />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
