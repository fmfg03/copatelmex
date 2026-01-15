import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TournamentInfo } from "@/components/TournamentInfo";

import { Categories } from "@/components/Categories";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <TournamentInfo />
      
      <Categories />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
