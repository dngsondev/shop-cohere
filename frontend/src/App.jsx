import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes/index';
import { Fragment } from 'react';
import DefaultLayout from './Layouts/DefaultLayout';
import AdminLayout from './Layouts/AdminLayout';

import './App.css';

function App({ authConfig }) {
  let user = JSON.parse(localStorage.getItem('user') || '{}');
  let id = user.id || null;

  return (
    <BrowserRouter>
      <Routes>
        {/* DefaultLayout routes */}
        <Route element={<DefaultLayout authConfig={authConfig} />}>
          {/* Public Routes using DefaultLayout */}
          {publicRoutes
            .filter(route => !route.layout || route.layout === DefaultLayout)
            .map((route, index) => {
              const Page = route.component;
              return (
                <Route
                  key={index}
                  path={route.path}
                  element={<Page authConfig={authConfig} />}
                />
              );
            })}

          {/* Private Routes using DefaultLayout */}
          {id && privateRoutes
            .filter(route => !route.layout || route.layout === DefaultLayout)
            .map((route, index) => {
              const Page = route.component;
              return (
                <Route
                  key={`private-${index}`}
                  path={route.path}
                  element={<Page authConfig={authConfig} />}
                />
              );
            })}
        </Route>

        {/* AdminLayout routes */}
        <Route element={<AdminLayout authConfig={authConfig} />}>
          {/* Public Routes using AdminLayout */}
          {publicRoutes
            .filter(route => route.layout === AdminLayout)
            .map((route, index) => {
              const Page = route.component;
              return (
                <Route
                  key={`admin-${index}`}
                  path={route.path}
                  element={<Page authConfig={authConfig} />}
                />
              );
            })}

          {/* Private Routes using AdminLayout */}
          {id && privateRoutes
            .filter(route => route.layout === AdminLayout)
            .map((route, index) => {
              const Page = route.component;
              return (
                <Route
                  key={`admin-private-${index}`}
                  path={route.path}
                  element={<Page authConfig={authConfig} />}
                />
              );
            })}
        </Route>

        {/* Routes without layout */}
        {publicRoutes
          .filter(route => route.layout === false)
          .map((route, index) => {
            const Page = route.component;
            return (
              <Route
                key={`no-layout-${index}`}
                path={route.path}
                element={<Page authConfig={authConfig} />}
              />
            );
          })}

        {id && privateRoutes
          .filter(route => route.layout === false)
          .map((route, index) => {
            const Page = route.component;
            return (
              <Route
                key={`no-layout-private-${index}`}
                path={route.path}
                element={<Page authConfig={authConfig} />}
              />
            );
          })}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
