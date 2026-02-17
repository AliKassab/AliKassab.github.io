let portfolio = [
    { title: 'Project 1', link: 'http://project1.com' },
    { title: 'Project 2', link: 'http://project2.com' },
    { title: 'Project 3', link: 'http://project3.com' }
];

function displayPortfolio() {
    let portfolioContainer = document.getElementById('portfolio');
    portfolio.forEach(project => {
        let projectElement = document.createElement('div');
        projectElement.innerHTML = `<a href="${project.link}">${project.title}</a>`;
        portfolioContainer.appendChild(projectElement);
    });
}

window.onload = displayPortfolio;