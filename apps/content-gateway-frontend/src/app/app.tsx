import { Link, Route } from "react-router-dom";

export function App() {
    return (
        <>
            <header>
                <h1>Welcome to the Content Gateway!</h1>
            </header>
            <main></main>
            <br />
            <hr />
            <br />
            <div role="navigation">
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/page-2">Page 2</Link>
                    </li>
                </ul>
            </div>
            <Route
                path="/"
                exact
                render={() => (
                    <div>
                        This is the generated root route.{" "}
                        <Link to="/page-2">Click here for page 2.</Link>
                    </div>
                )}
            />
            <Route
                path="/page-2"
                exact
                render={() => (
                    <div>
                        <Link to="/">Click here to go back to root page.</Link>
                    </div>
                )}
            />
        </>
    );
}

export default App;
