import React from 'react'
import { Redirect } from 'react-router-dom'
import ParticlesElement from '../Components/Particles'
import '../css/Page-Template.css';

class PageTemplate extends React.Component {
    constructor(props) {
        super(props)
        this.props = props
    }
    render() {
        // let username = localStorage.getItem('username')
        // if (!username) return <Redirect to='/' />
        const clickHandler = async () => {
            let search = document.getElementById('search')
            if (!search) return
            console.log('searched for:', search)
        }

        const handleKeyDown = e => {
            if (e.key === 'Enter') clickHandler()
        }
        return (
            <div className="App">
                <ParticlesElement />
                <div className='SideBar'>
                    <ul>
                        <li>
                            <a className={this.props.highLight === "0" ? "active" : ""} href='/'>Home</a>
                        </li>
                        <li>
                            <a className={this.props.highLight === "1" ? "active" : ""} href='asset'>Asset Tracking</a>
                        </li>
                        <li>
                            <a className={this.props.highLight === "2" ? "active" : ""} href="hourly">Hourly Tracking</a>
                        </li>
                        <li>
                            <a className={this.props.highLight === "3" ? "active" : ""} href="daily">Daily Dollars</a>
                        </li>
                        <li>
                            <a className={this.props.highLight === "4" ? "active" : ""} href="reports">Reports</a>
                        </li>
                        <li>
                            <div className='dropDownHeader'>
                                <a className={this.props.highLight === "5" ? "active" : ""} href='tools'>Tools</a>
                                <div className='dropdown-content'>
                                    <a href='importer'>Importer</a>
                                    <a href='admin'>Admin</a>
                                </div>
                            </div>
                        </li>
                    </ul>
                    <div className='AccountButton'>
                        <p>{/*Place holder for username*/'Thomas'}</p>
                    </div>
                </div>
                <div className="searchBox">
                    <input className="searchInput" type="text" id='search' placeholder="Search" onKeyDown={handleKeyDown} />
                    <button className="searchButton" onClick={clickHandler}>
                        <i className="material-icons">search</i>
                    </button>
                </div>
            </div>
        )
    }
}

export default PageTemplate