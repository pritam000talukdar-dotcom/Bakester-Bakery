import React from 'react';
import Hero from '../components/sections/Hero';
import Specialities from '../components/sections/Specialities';
import AboutSnippet from '../components/sections/AboutSnippet';
import BestSellers from '../components/sections/BestSellers';
import ChocolateAd from '../components/sections/ChocolateAd';
import ShopNowCTA from '../components/sections/ShopNowCTA';

export default function Home() {
  return (
    <main>
      <Hero />
      <Specialities />
      <BestSellers />
      <ChocolateAd />
      <AboutSnippet />
      <ShopNowCTA />
    </main>
  );
}
