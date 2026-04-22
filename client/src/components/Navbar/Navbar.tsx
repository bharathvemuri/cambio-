function Navbar() {



    return (
        <nav className="navbar flex items-center justify-between p-4 bg-gray-800 text-white sticky top-0 z-50">
            <h1 className="navbar-title">camb.io</h1>
            <div className="navbar-links float-right">
                <button className="navbar-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 m-2 rounded">vs. Players</button>
                <button className="navbar-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 m-2 rounded">vs. Computer</button>
            </div>
        </nav>
    )
}


export default Navbar;