'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout {

    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, duration, distance) {
        this.coords = coords;
        this.duration = duration;
        this.distance = distance;
    }

    setTitleDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.titleDescription = `${this.name[0].toUpperCase()}${this.name.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    name = 'running';

    constructor(coords, duration, distance, cadence) {
        super(coords, duration, distance);
        this.cadence = cadence;
        this.calcPace();
        this.setTitleDescription();
    }

    calcPace() {
        this.pace = Number((this.duration / this.distance).toFixed(1));
    }
}
class Cycling extends Workout {
    name = 'cycling';

    constructor(coords, duration, distance, elevationGain) {
        super(coords, duration, distance);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this.setTitleDescription();
    }

    calcSpeed() {
        this.speed = (this.distance / (this.duration / 60)).toFixed(1);
    }
}

class App {

    #map;
    #mapZoomLevel = 17;
    #mapEvent;
    #workouts = [];

    constructor() { 
        this.#getPosition();
        form.addEventListener('submit', this.newWorkout.bind(this));
        inputType.addEventListener('change', this.toggleElevationField);
        containerWorkouts.addEventListener('click', this.moveToPopUp.bind(this));
    }

    #getPosition() {
        if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this.loadMap.bind(this), () => {
            alert('Unable to get your current position');
        });
    }

    loadMap(position) {
        const { latitude, longitude } = position.coords;
        this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
    
        L.tileLayer('https://cdn.lima-labs.com/{z}/{x}/{y}.png?api=demo', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
    
        L.marker([latitude, longitude]).addTo(this.#map)
            .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
            .openPopup();
    
            this.#map.on('click', this.showForm.bind(this))
    }

    showForm({ latlng }) {
        this.#mapEvent = latlng;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    hideForm() {
        form.style.display = 'none';
        this.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
        inputDistance.value = '';
        inputDuration.value = '';
        inputCadence.value = '';
        inputElevation.value = '';
        inputDistance.blur();
    };

    toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    renderMarket({ coords, name, titleDescription }) {
        L.marker(coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${name}-popup`,
                })
            )
            .setPopupContent(`<h3>${name === 'running' ? '🏃‍♂️': '🚴‍♀️'} ${titleDescription}</h3>`)
            .openPopup();
    }

    renderWorkoutList({ id, duration, distance, cadence, pace, name, speed, elevationGain, titleDescription }) {
        const wotkoutHtml = `<li class="workout workout--${name}" data-id="${id}">
            <h2 class="workout__title">${titleDescription}</h2>
            <div class="workout__details">
            <span class="workout__icon">${name === 'running' ? '🏃‍♂️': '🚴‍♀️'}</span>
            <span class="workout__value">${distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${duration}</span>
            <span class="workout__unit">min</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${name === 'running' ? pace : speed}</span>
            <span class="workout__unit">${name === 'running' ? 'min/km': 'km/h'}</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">${name === 'running' ? '🦶🏼': '⛰️'}</span>
            <span class="workout__value">${name === 'running' ? cadence : elevationGain}</span>
            <span class="workout__unit">${name === 'running' ? 'spm': 'm'}</span>
            </div>
        </li>`;

        form.insertAdjacentHTML('afterend', wotkoutHtml);
    }

    newWorkout(event) {
        event.preventDefault();
        const { lat, lng } = this.#mapEvent;
        const distance = Number(inputDistance.value)
        const duration = Number(inputDuration.value);
        let workout;

        const arePositiveNumbers = (...inputs) => {
            return inputs.every(input => Number.isFinite(input) && input > 0);
        }

        if (inputType.value === 'running') {
            const cadence = Number(inputCadence.value);
            if (!arePositiveNumbers(distance, duration, cadence)) return alert('Inputs have to be positive numbers!');
            workout = new Running([lat, lng], duration, distance, cadence);
        }
        
        if (inputType.value === 'cycling'){
            const elevation = Number(inputElevation.value);
            if (!arePositiveNumbers(distance, duration, elevation)) return alert('Inputs have to be positive numbers!');
            workout = new Cycling([lat, lng], duration, distance, elevation);
        }

        this.#workouts.push(workout);
        this.renderMarket(workout);
        this.hideForm.call(event.target);
        this.renderWorkoutList(workout);
    }

    moveToPopUp(event) {
        const workoutCard = event.target.closest('.workout');
        if (!workoutCard) return;
        
        const workout = this.#workouts.find(workout => workout.id === workoutCard.dataset.id);
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            duration: 1,
        });
    }
}

const app = new App();