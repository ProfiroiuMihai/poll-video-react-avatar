import { Route, Routes } from 'react-router-dom';
import routesData from './setup/routes';

function App() {
  return (
    <Routes>
      {routesData.map((item) => (
        <Route key={item?.id} path={item?.path} element={item?.element} />
      ))}
    </Routes>
  );
}

export default App;
