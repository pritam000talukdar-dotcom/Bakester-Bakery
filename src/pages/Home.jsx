import React from 'react';
import Hero from '../components/sections/Hero';
import Specialities from '../components/sections/Specialities';
import AboutSnippet from '../components/sections/AboutSnippet';
import BestSellers from '../components/sections/BestSellers';
import Newsletter from '../components/sections/Newsletter';

export default function Home() {
  return (
    <main>
      <Hero />
      <Specialities />
      <AboutSnippet />
      <BestSellers />
      <Newsletter />
    </main>
  );
}
