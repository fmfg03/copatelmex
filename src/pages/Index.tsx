import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TournamentInfo } from "@/components/TournamentInfo";
import { TournamentHighlights } from "@/components/TournamentHighlights";
import { Categories } from "@/components/Categories";
import { Venues } from "@/components/Venues";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <TournamentInfo />
      <TournamentHighlights />
      <Categories />
      <Venues />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
