import React from 'react';
import { Link } from 'react-router-dom';
import { Music2, Waves, Headphones } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
          Professional Audio Services
          <span className="block text-indigo-600">Made Simple</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your music with professional mixing and mastering services.
          Work with top-tier audio engineers and get studio-quality results.
        </p>
        <div className="mt-8">
          <Link
            to="/register"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Music2 className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Professional Mixing</h3>
          <p className="mt-2 text-gray-600">
            Get your tracks mixed by experienced engineers who understand your vision
            and musical style.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Waves className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Expert Mastering</h3>
          <p className="mt-2 text-gray-600">
            Take your mixes to the next level with professional mastering that makes
            your music ready for release.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Headphones className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Unlimited Revisions</h3>
          <p className="mt-2 text-gray-600">
            Work directly with engineers until you're completely satisfied with the results.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center">How It Works</h2>
        <div className="mt-8 grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="mt-4 text-lg font-semibold">Upload Your Tracks</h3>
            <p className="mt-2 text-gray-600">
              Submit your audio files and project details
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="mt-4 text-lg font-semibold">Get Matched</h3>
            <p className="mt-2 text-gray-600">
              We'll pair you with the perfect engineer
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="mt-4 text-lg font-semibold">Review & Feedback</h3>
            <p className="mt-2 text-gray-600">
              Receive your mix and request revisions
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto">
              4
            </div>
            <h3 className="mt-4 text-lg font-semibold">Download & Release</h3>
            <p className="mt-2 text-gray-600">
              Get your finished tracks ready for release
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}